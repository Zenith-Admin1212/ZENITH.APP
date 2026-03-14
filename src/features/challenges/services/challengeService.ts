import { supabase }   from '@/lib/supabase/client'
import { addXP }      from '@/features/xp/services/xpEngine'
import { pushNotification } from '@/features/notifications/services/notificationService'
import { format, differenceInDays, parseISO } from 'date-fns'
import { PRESET_CHALLENGES, CHALLENGE_FAIL_THRESHOLD } from '../constants/challengePresets'
import type {
  Challenge, ChallengeParticipant, ChallengeProgressLog,
  ChallengeKind, ChallengeStatus,
} from '@/types'

// ═══════════════════════════════════════════════════════════════
//  Challenge Service
//
//  All DB operations for the challenge system.
//  Progress calculation is type-aware (4 challenge kinds).
//  Fail state: consecutive_misses >= 2 → status = 'failed'.
//  Completion: progress_value >= target_value → status = 'completed'.
//  XP rewards route through addXP() → always logged in xp_transactions.
// ═══════════════════════════════════════════════════════════════

// ── Derived types for UI ──────────────────────────────────────

export interface EnrichedParticipant extends ChallengeParticipant {
  rank:              number
  pct:               number     // 0–100 progress percentage
  motivationalMsg:   string
}

export interface ActiveChallengeDetail {
  challenge:    Challenge
  participants: EnrichedParticipant[]
  self:         EnrichedParticipant | null
  daysLeft:     number
  daysTotal:    number
  endDate:      string
}

// ── Fetch all available challenges ───────────────────────────
export async function fetchChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error || !data || data.length === 0) {
    // Fall back to presets during development / before Phase 15 schema
    return PRESET_CHALLENGES
  }

  return data as Challenge[]
}

// ── Fetch user's enrolled challenges ────────────────────────
export async function fetchUserChallenges(userId: string): Promise<ChallengeParticipant[]> {
  const { data, error } = await supabase
    .from('challenge_participants')
    .select('*')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ChallengeParticipant[]
}

// ── Fetch all participants for a challenge ───────────────────
export async function fetchChallengeParticipants(
  challengeId: string
): Promise<EnrichedParticipant[]> {
  const { data, error } = await supabase
    .from('challenge_participants')
    .select(`
      *,
      users!challenge_participants_user_id_fkey (
        username, avatar, level_name
      )
    `)
    .eq('challenge_id', challengeId)
    .neq('status', 'abandoned')
    .order('progress_value', { ascending: false })

  if (error) throw error

  return (data ?? []).map((p, i) => {
    const raw: ChallengeParticipant = {
      ...p,
      username:   p.users?.username ?? null,
      avatar:     p.users?.avatar   ?? '👤',
      level_name: p.users?.level_name ?? 'Bronze',
    }
    return enrichParticipant(raw, i + 1)
  })
}

// ── Enrich a participant with rank, pct, motivational msg ────
function enrichParticipant(
  p:    ChallengeParticipant,
  rank: number,
  target?: number
): EnrichedParticipant {
  const pct = target && target > 0
    ? Math.min(Math.round((p.progress_value / target) * 100), 100)
    : 0

  const motivationalMsg = buildMotivationalMsg(p, rank)

  return { ...p, rank, pct, motivationalMsg }
}

function buildMotivationalMsg(p: ChallengeParticipant, rank: number): string {
  if (p.status === 'completed') return '✅ Challenge complete!'
  if (p.status === 'failed')    return '💀 Challenge failed — try again'

  if (p.consecutive_misses === 1) return '⚠️ One more miss and you\'re out!'
  if (rank === 1)                  return '🔥 You\'re leading — don\'t stop now!'
  if (rank === 2)                  return `🥈 #2 — push harder to take the lead`
  if (rank <= 5)                   return `💪 You're in the top 5 — keep going`
  return '🚀 Keep climbing the ranks'
}

// ── Join a challenge ─────────────────────────────────────────
export async function joinChallenge(
  userId:      string,
  challengeId: string
): Promise<ChallengeParticipant> {
  // Prevent duplicate enrollment
  const { data: existing } = await supabase
    .from('challenge_participants')
    .select('id, status')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .maybeSingle()

  if (existing && existing.status === 'active') {
    throw new Error('Already enrolled in this challenge')
  }

  const { data, error } = await supabase
    .from('challenge_participants')
    .upsert(
      {
        user_id:            userId,
        challenge_id:       challengeId,
        status:             'active',
        progress_value:     0,
        consecutive_misses: 0,
        joined_at:          new Date().toISOString(),
        completed_at:       null,
        failed_at:          null,
      },
      { onConflict: 'user_id,challenge_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data as ChallengeParticipant
}

// ── Leave / abandon a challenge ──────────────────────────────
export async function leaveChallenge(
  userId:      string,
  challengeId: string
): Promise<void> {
  const { error } = await supabase
    .from('challenge_participants')
    .update({ status: 'abandoned' })
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .eq('status', 'active')  // only abandon active entries

  if (error) throw error
}

// ── Record daily progress ────────────────────────────────────
// Called by the daily check-in / habit completion pipeline.
// kind determines what `value` means:
//   habit_streak    → streak days (current streak value from users table)
//   xp_race         → XP earned today
//   perfect_week    → 1 if all habits completed today, else 0
//   pomodoro_sprint → pomodoro sessions completed today
export async function recordChallengeProgress(
  userId:      string,
  challengeId: string,
  kind:        ChallengeKind,
  value:       number,
  target:      number
): Promise<{ status: ChallengeStatus; completed: boolean; failed: boolean }> {
  const today = format(new Date(), 'yyyy-MM-dd')

  // Idempotent upsert — only one log per day per participant
  await supabase
    .from('challenge_progress')
    .upsert(
      { user_id: userId, challenge_id: challengeId, date: today, value },
      { onConflict: 'user_id,challenge_id,date' }
    )

  // Fetch current participant record
  const { data: participant, error } = await supabase
    .from('challenge_participants')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .single()

  if (error || !participant) throw error ?? new Error('Participant not found')
  if (participant.status !== 'active') return { status: participant.status, completed: false, failed: false }

  const isMiss = value === 0

  let newMisses   = isMiss ? participant.consecutive_misses + 1 : 0
  let newProgress = computeNewProgress(kind, participant.progress_value, value)
  let newStatus: ChallengeStatus = 'active'

  // ── Fail check ────────────────────────────────────────────
  if (newMisses >= CHALLENGE_FAIL_THRESHOLD) {
    newStatus = 'failed'
    await supabase
      .from('challenge_participants')
      .update({
        status:             'failed',
        consecutive_misses: newMisses,
        progress_value:     newProgress,
        failed_at:          new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)

    await pushNotification(
      userId,
      'challenge_update',
      'Challenge Failed 💀',
      'You missed too many days. Better luck next time!'
    )

    return { status: 'failed', completed: false, failed: true }
  }

  // ── Completion check ──────────────────────────────────────
  const isComplete = newProgress >= target

  if (isComplete) {
    newStatus = 'completed'
    await supabase
      .from('challenge_participants')
      .update({
        status:         'completed',
        progress_value: newProgress,
        consecutive_misses: 0,
        completed_at:   new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)

    return { status: 'completed', completed: true, failed: false }
  }

  // ── Normal progress update ────────────────────────────────
  await supabase
    .from('challenge_participants')
    .update({
      progress_value:     newProgress,
      consecutive_misses: newMisses,
    })
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)

  return { status: 'active', completed: false, failed: false }
}

function computeNewProgress(
  kind:     ChallengeKind,
  current:  number,
  todayVal: number
): number {
  switch (kind) {
    case 'habit_streak':
      // For streaks, progress = current streak value (not cumulative)
      return todayVal
    case 'xp_race':
    case 'pomodoro_sprint':
    case 'perfect_week':
      // Cumulative — add today's value
      return current + todayVal
  }
}

// ── Grant XP reward on completion ────────────────────────────
export async function grantChallengeReward(
  userId:      string,
  challengeId: string,
  xpReward:    number,
  badgeName:   string | null
): Promise<void> {
  await addXP(
    userId,
    xpReward,
    'challenge_complete',
    `Challenge complete: ${badgeName ?? challengeId}`
  )

  await pushNotification(
    userId,
    'challenge_update',
    `Challenge Complete! ${badgeName ? `🏅 ${badgeName}` : ''}`,
    `You earned ${xpReward} XP for completing the challenge!`
  )
}

// ── Fetch progress log for a user's challenge ────────────────
export async function fetchProgressLog(
  userId:      string,
  challengeId: string
): Promise<ChallengeProgressLog[]> {
  const { data, error } = await supabase
    .from('challenge_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .order('date', { ascending: true })

  if (error) throw error
  return (data ?? []) as ChallengeProgressLog[]
}

// ── Build full active challenge detail ───────────────────────
export async function fetchActiveChallengeDetail(
  userId:    string,
  challenge: Challenge,
  selfParticipant: ChallengeParticipant
): Promise<ActiveChallengeDetail> {
  const participants = await fetchChallengeParticipants(challenge.id)

  const joinedAt  = parseISO(selfParticipant.joined_at)
  const endDate   = new Date(joinedAt)
  endDate.setDate(endDate.getDate() + challenge.duration_days)
  const daysLeft  = Math.max(0, differenceInDays(endDate, new Date()))
  const endStr    = format(endDate, 'MMM d')

  // Re-enrich with target for accurate pct
  const enriched = participants.map((p, i) => ({
    ...p,
    pct: challenge.target_value > 0
      ? Math.min(Math.round((p.progress_value / challenge.target_value) * 100), 100)
      : 0,
  }))

  const self = enriched.find(p => p.user_id === userId) ?? null

  // Motivational copy for self uses days left
  let selfMsg = self?.motivationalMsg ?? ''
  if (self?.status === 'active' && daysLeft > 0) {
    if (daysLeft <= 3) selfMsg = `🚨 Only ${daysLeft} day${daysLeft > 1 ? 's' : ''} left — finish strong!`
    else if (self.rank === 2) selfMsg = `🥈 You're #2 — ${enriched[0]?.progress_value - self.progress_value} behind the leader`
    else if (self.rank === 1) selfMsg = `🔥 You're leading with ${self.progress_value} — don't slow down!`
  }

  return {
    challenge,
    participants: enriched,
    self:         self ? { ...self, motivationalMsg: selfMsg } : null,
    daysLeft,
    daysTotal:    challenge.duration_days,
    endDate:      endStr,
  }
}

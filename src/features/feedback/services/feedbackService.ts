import { supabase } from '@/lib/supabase/client'

// ═══════════════════════════════════════════════════════════════
//  Feedback Service
//  Inserts user feedback into the `feedback` table.
//  Admin can review/resolve these in Phase 12 admin panel.
// ═══════════════════════════════════════════════════════════════

export type FeedbackType = 'bug' | 'feature' | 'general'

export async function submitFeedback(
  userId:  string,
  type:    FeedbackType,
  message: string
): Promise<void> {
  if (!message.trim()) throw new Error('Message is required')

  const { error } = await supabase.from('feedback').insert({
    user_id:    userId,
    type,
    message:    message.trim(),
    status:     'open',
    created_at: new Date().toISOString(),
  })

  if (error) throw error
}

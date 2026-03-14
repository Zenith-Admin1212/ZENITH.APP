import type { ThemeId } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  ZENITH — Theme Configuration  (Phase 7 extended)
//  Layout modes define how each theme renders UI components.
// ═══════════════════════════════════════════════════════════════

export type CardStyle        = 'hud' | 'glass' | 'molten' | 'tactical' | 'luxury'
export type NavigationStyle  = 'neon' | 'soft' | 'aggressive' | 'radar' | 'elegant'
export type AnimationStyle   = 'glow' | 'float' | 'pulse' | 'minimal' | 'smooth'
export type ParticleStyle    = 'grid' | 'stars' | 'embers' | 'scanlines' | 'goldDust'

export interface ThemeLayoutMode {
  cardStyle:       CardStyle
  navigationStyle: NavigationStyle
  animationStyle:  AnimationStyle
  particleStyle:   ParticleStyle
}

export interface ThemeConfigExtended {
  id:           ThemeId
  name:         string
  description:  string
  tier:         'free' | 'premium'
  previewColor: string
  gradientFrom: string
  gradientTo:   string
  particleType: 'grid' | 'stars' | 'fire' | 'scanline' | 'dust'
  navStyle:     'neon' | 'hud' | 'flame' | 'tron' | 'gold'
  fontDisplay:  string
  fontBody:     string
  layout:       ThemeLayoutMode
  shareCardBg:  [string, string]
}

export const THEMES: Record<ThemeId, ThemeConfigExtended> = {
  'dark-cyber': {
    id: 'dark-cyber', name: 'Dark Cyber',
    description: 'Neon cyan and purple — the original ZENITH aesthetic',
    tier: 'free', previewColor: '#00f5ff', gradientFrom: '#00f5ff', gradientTo: '#a855f7',
    particleType: 'grid', navStyle: 'neon', fontDisplay: 'Orbitron', fontBody: 'Rajdhani',
    layout: { cardStyle: 'hud', navigationStyle: 'neon', animationStyle: 'glow', particleStyle: 'grid' },
    shareCardBg: ['#0a0a1a', '#0d1a2e'],
  },
  'cosmic': {
    id: 'cosmic', name: 'Cosmic',
    description: 'Deep space starfield with glowing HUD panels',
    tier: 'premium', previewColor: '#60a5fa', gradientFrom: '#60a5fa', gradientTo: '#818cf8',
    particleType: 'stars', navStyle: 'hud', fontDisplay: 'Exo 2', fontBody: 'Exo 2',
    layout: { cardStyle: 'glass', navigationStyle: 'soft', animationStyle: 'float', particleStyle: 'stars' },
    shareCardBg: ['#0b0d1a', '#0f1535'],
  },
  'inferno': {
    id: 'inferno', name: 'Inferno',
    description: 'Fire and flame effects with intense orange glow',
    tier: 'premium', previewColor: '#f97316', gradientFrom: '#f97316', gradientTo: '#ef4444',
    particleType: 'fire', navStyle: 'flame', fontDisplay: 'Bebas Neue', fontBody: 'Barlow',
    layout: { cardStyle: 'molten', navigationStyle: 'aggressive', animationStyle: 'pulse', particleStyle: 'embers' },
    shareCardBg: ['#1a0700', '#2d0f00'],
  },
  'tactician': {
    id: 'tactician', name: 'Tactician',
    description: 'Clean dark Tron-style with cyan performance rings',
    tier: 'premium', previewColor: '#22d3ee', gradientFrom: '#22d3ee', gradientTo: '#0e7490',
    particleType: 'scanline', navStyle: 'tron', fontDisplay: 'Share Tech Mono', fontBody: 'Share Tech',
    layout: { cardStyle: 'tactical', navigationStyle: 'radar', animationStyle: 'minimal', particleStyle: 'scanlines' },
    shareCardBg: ['#050f12', '#071820'],
  },
  'gold-luxe': {
    id: 'gold-luxe', name: 'Gold Luxe',
    description: 'Royal black and gold gradient — luxury and power',
    tier: 'premium', previewColor: '#f59e0b', gradientFrom: '#f59e0b', gradientTo: '#b45309',
    particleType: 'dust', navStyle: 'gold', fontDisplay: 'Cinzel', fontBody: 'Raleway',
    layout: { cardStyle: 'luxury', navigationStyle: 'elegant', animationStyle: 'smooth', particleStyle: 'goldDust' },
    shareCardBg: ['#0d0a00', '#1a1200'],
  },
}

export const THEME_IDS:       ThemeId[] = Object.keys(THEMES) as ThemeId[]
export const FREE_THEMES:     ThemeId[] = ['dark-cyber']
export const PREMIUM_THEMES:  ThemeId[] = ['cosmic', 'inferno', 'tactician', 'gold-luxe']
export const DEFAULT_THEME:   ThemeId   = 'dark-cyber'
export const THEME_ORDER:     ThemeId[] = ['dark-cyber', 'cosmic', 'inferno', 'tactician', 'gold-luxe']
export const THEME_SWITCH_COOLDOWN = 1200

export function getThemeLayout(themeId: ThemeId): ThemeLayoutMode {
  return THEMES[themeId].layout
}

export function getThemeGradient(themeId: ThemeId): string {
  const t = THEMES[themeId]
  return `linear-gradient(135deg, ${t.gradientFrom}22 0%, ${t.gradientTo}11 100%)`
}

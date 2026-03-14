import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeId } from '@/types'
import { DEFAULT_THEME } from '@/lib/themes/theme-config'

interface ThemeState {
  activeTheme: ThemeId
  setTheme: (theme: ThemeId) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      activeTheme: DEFAULT_THEME,
      setTheme: (theme) => set({ activeTheme: theme }),
    }),
    {
      name: 'zenith-theme',
    }
  )
)

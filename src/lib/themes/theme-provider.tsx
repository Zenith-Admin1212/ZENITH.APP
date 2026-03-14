'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import type { ThemeId } from '@/types'
import { DEFAULT_THEME, THEME_SWITCH_COOLDOWN } from './theme-config'
import { useThemeStore } from '@/stores/themeStore'

// ═══════════════════════════════════════════════════════════════
//  Theme Context
// ═══════════════════════════════════════════════════════════════

interface ThemeContextValue {
  activeTheme: ThemeId
  isTransitioning: boolean
  switchTheme: (themeId: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  activeTheme: DEFAULT_THEME,
  isTransitioning: false,
  switchTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

// ═══════════════════════════════════════════════════════════════
//  Theme Provider
// ═══════════════════════════════════════════════════════════════

interface ThemeProviderProps {
  children: React.ReactNode
  initialTheme?: ThemeId
}

export function ThemeProvider({ children, initialTheme = DEFAULT_THEME }: ThemeProviderProps) {
  const { activeTheme, setTheme } = useThemeStore()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const cooldownRef = useRef(false)
  const mounted = useRef(false)

  // Apply theme to <html> element via data-theme attribute
  const applyTheme = useCallback((themeId: ThemeId) => {
    if (typeof document === 'undefined') return
    
    const html = document.documentElement
    
    // Fade out
    html.classList.add('theme-transitioning')
    
    // Swap theme after brief delay for smooth transition
    requestAnimationFrame(() => {
      html.setAttribute('data-theme', themeId)
      
      // Force a brief repaint
      requestAnimationFrame(() => {
        html.classList.remove('theme-transitioning')
      })
    })
  }, [])

  // Initialize theme on mount
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      const theme = activeTheme || initialTheme
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [activeTheme, initialTheme])

  // Theme switch with cooldown lock
  const switchTheme = useCallback((themeId: ThemeId) => {
    // Prevent rapid switching
    if (cooldownRef.current || isTransitioning) return
    if (themeId === activeTheme) return

    cooldownRef.current = true
    setIsTransitioning(true)

    applyTheme(themeId)
    setTheme(themeId)

    // Release cooldown after animation completes
    setTimeout(() => {
      cooldownRef.current = false
      setIsTransitioning(false)
    }, THEME_SWITCH_COOLDOWN)
  }, [activeTheme, isTransitioning, applyTheme, setTheme])

  return (
    <ThemeContext.Provider value={{ activeTheme: activeTheme || initialTheme, isTransitioning, switchTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

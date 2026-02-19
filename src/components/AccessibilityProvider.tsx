'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface AccessibilityContextType {
  reduceAnimations: boolean
  easyReadFont: boolean
  toggleReduceAnimations: () => void
  toggleEasyReadFont: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  reduceAnimations: false,
  easyReadFont: false,
  toggleReduceAnimations: () => {},
  toggleEasyReadFont: () => {},
})

export function useAccessibility() {
  return useContext(AccessibilityContext)
}

const STORAGE_KEY_ANIMATIONS = 'botcafe-reduce-animations'
const STORAGE_KEY_FONT = 'botcafe-easy-read-font'

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [reduceAnimations, setReduceAnimations] = useState(false)
  const [easyReadFont, setEasyReadFont] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Initialize from localStorage and prefers-reduced-motion on mount
  useEffect(() => {
    const storedAnimations = localStorage.getItem(STORAGE_KEY_ANIMATIONS)
    const storedFont = localStorage.getItem(STORAGE_KEY_FONT)

    if (storedAnimations !== null) {
      setReduceAnimations(storedAnimations === 'true')
    } else {
      // Default to user's OS preference
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      setReduceAnimations(prefersReduced)
    }

    if (storedFont !== null) {
      setEasyReadFont(storedFont === 'true')
    }

    setMounted(true)
  }, [])

  // Apply classes to <html> element
  useEffect(() => {
    if (!mounted) return

    const html = document.documentElement

    if (reduceAnimations) {
      html.classList.add('reduce-animations')
    } else {
      html.classList.remove('reduce-animations')
    }

    if (easyReadFont) {
      html.classList.add('easy-read-font')
    } else {
      html.classList.remove('easy-read-font')
    }
  }, [reduceAnimations, easyReadFont, mounted])

  const toggleReduceAnimations = useCallback(() => {
    setReduceAnimations((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY_ANIMATIONS, String(next))
      return next
    })
  }, [])

  const toggleEasyReadFont = useCallback(() => {
    setEasyReadFont((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY_FONT, String(next))
      return next
    })
  }, [])

  return (
    <AccessibilityContext.Provider
      value={{ reduceAnimations, easyReadFont, toggleReduceAnimations, toggleEasyReadFont }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

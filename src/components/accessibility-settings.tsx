'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Accessibility } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAccessibility } from '@/components/AccessibilityProvider'

export const AccessibilitySettings = () => {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { reduceAnimations, easyReadFont, toggleReduceAnimations, toggleEasyReadFont } =
    useAccessibility()

  // Bump up above the chat input bar on conversation pages
  const isOnChatPage = pathname?.startsWith('/chat/') && pathname !== '/chat/new'

  return (
    <div className={`fixed left-4 z-50 ${isOnChatPage ? 'bottom-24' : 'bottom-4'}`}>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Accessibility settings"
        aria-expanded={open}
        className="w-11 h-11 rounded-full glass-rune flex items-center justify-center text-parchment hover:text-gold-rich transition-colors shadow-lg"
      >
        <Accessibility className="w-5 h-5" />
      </button>

      {/* Settings panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />

          <div className="absolute bottom-14 left-0 w-72 glass-rune rounded-lg p-4 shadow-xl">
            <h3 className="text-sm font-display font-bold text-gold-rich mb-4">Accessibility</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Label
                    htmlFor="reduce-animations"
                    className="text-sm text-parchment cursor-pointer"
                  >
                    Reduce Animations
                  </Label>
                  <p className="text-xs text-parchment-dim mt-0.5">
                    Stops background effects and motion
                  </p>
                </div>
                <Switch
                  id="reduce-animations"
                  checked={reduceAnimations}
                  onCheckedChange={toggleReduceAnimations}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Label htmlFor="easy-read-font" className="text-sm text-parchment cursor-pointer">
                    Easy Read Font
                  </Label>
                  <p className="text-xs text-parchment-dim mt-0.5">
                    Switches to a cleaner, simpler font
                  </p>
                </div>
                <Switch
                  id="easy-read-font"
                  checked={easyReadFont}
                  onCheckedChange={toggleEasyReadFont}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

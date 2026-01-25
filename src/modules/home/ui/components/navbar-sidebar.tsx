'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUser, SignInButton } from '@clerk/nextjs'
import {
  User,
  BookOpen,
  Brain,
  Users,
  HelpCircle,
} from 'lucide-react'

interface NavbarSidebarProps {
  items: { href: string; children: string }[]
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: { email: string } | null
}

const userMenuItems = [
  { href: '/dashboard', children: 'My Bots', icon: User },
  { href: '/dashboard?tab=lore', children: 'Lore', icon: BookOpen },
  { href: '/dashboard?tab=memories', children: 'Memories', icon: Brain },
  { href: '/dashboard?tab=personas', children: 'Personas', icon: Users },
  { href: '/help', children: 'Help', icon: HelpCircle },
]

export const NavbarSidebar = ({ items, open, onOpenChange }: NavbarSidebarProps) => {
  const pathname = usePathname()
  const { isSignedIn } = useUser()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 glass-rune border-gold-ancient/30 overflow-y-auto">
        <SheetHeader className="border-b border-gold-ancient/20 pb-4">
          <SheetTitle className="font-display text-xl text-parchment">
            Bot<span className="text-gold-rich">Cafe</span>
          </SheetTitle>
        </SheetHeader>

        {/* Main Navigation */}
        <nav className="flex flex-col gap-1 mt-6">
          <span className="text-xs uppercase tracking-widest text-gold-ancient/50 px-3 mb-2">
            Navigation
          </span>
          {items.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={cn(
                'justify-start font-lore italic text-parchment hover:text-gold-rich hover:bg-gold-rich/10',
                pathname === item.href && 'text-gold-rich bg-gold-rich/10',
              )}
              onClick={() => onOpenChange(false)}
            >
              <Link href={item.href}>{item.children}</Link>
            </Button>
          ))}
        </nav>

        {/* User Menu (when signed in) */}
        {isSignedIn && (
          <nav className="flex flex-col gap-1 mt-6">
            <span className="text-xs uppercase tracking-widest text-gold-ancient/50 px-3 mb-2">
              My Studio
            </span>
            {userMenuItems.map((item) => (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                className={cn(
                  'justify-start font-lore text-parchment hover:text-gold-rich hover:bg-gold-rich/10',
                  pathname === item.href && 'text-gold-rich bg-gold-rich/10',
                )}
                onClick={() => onOpenChange(false)}
              >
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  {item.children}
                </Link>
              </Button>
            ))}
          </nav>
        )}

        {/* Auth Section */}
        <div className="mt-6 pt-6 border-t border-gold-ancient/20">
          {!isSignedIn && (
            <SignInButton>
              <Button className="w-full font-display tracking-widest bg-gold-rich/20 hover:bg-gold-rich/30 text-gold-rich border border-gold-ancient/30">
                Sign In
              </Button>
            </SignInButton>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

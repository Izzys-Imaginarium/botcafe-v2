'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Menu,
  Coffee,
  User,
  BookOpen,
  Brain,
  Users,
  BarChart3,
  Heart,
  HelpCircle,
  ChevronDown,
} from 'lucide-react'
import { NavbarSidebar } from './navbar-sidebar'
import { useUser, UserButton, SignInButton } from '@clerk/nextjs'

interface NavbarItemProps {
  href: string
  children: React.ReactNode
  isActive?: boolean
}

const NavbarItem = ({ href, children, isActive }: NavbarItemProps) => {
  return (
    <Link
      href={href}
      className={cn(
        'text-base font-lore italic text-parchment hover:text-gold-rich transition-colors duration-200 relative group py-2 px-3 rounded-sm',
        isActive && 'text-gold-rich',
      )}
    >
      {children}
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gold-rich transition-all group-hover:w-full"></span>
    </Link>
  )
}

const navbarItems = [
  { href: '/', children: 'Home' },
  { href: '/explore', children: 'Explore' },
  { href: '/creators', children: 'Creators' },
  { href: '/create', children: 'Create' },
]

const userMenuItems = [
  { href: '/account', children: 'My Bots', icon: User },
  { href: '/lore', children: 'Lore', icon: BookOpen },
  { href: '/memories/library', children: 'Memories', icon: Brain },
  { href: '/personas', children: 'Personas', icon: Users },
  { href: '/analytics', children: 'Analytics', icon: BarChart3 },
  { href: '/wellbeing', children: 'Wellbeing', icon: Heart },
]

interface NavbarProps {
  user?: { email: string } | null
}

export const Navbar = ({ user }: NavbarProps) => {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isSignedIn } = useUser()

  return (
    <header className="fixed top-0 w-full z-50 border-b border-gold-ancient/30 bg-[#0a140a]/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-4 cursor-pointer group">
            <div className="w-12 h-12 relative flex items-center justify-center">
              <div className="absolute inset-0 border border-gold-rich/50 rounded-full animate-[spin_12s_linear_infinite]"></div>
              <div className="absolute inset-1 border border-forest/50 rounded-full animate-[spin_8s_linear_infinite_reverse]"></div>
              <Coffee className="text-gold-rich text-2xl drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-2xl text-parchment tracking-wider text-glow-gold">
                Bot<span className="text-gold-rich">Café</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-4 px-6 py-3 bg-[#0a140a]/30 rounded-full border border-gold-ancient/20 backdrop-blur-sm">
              {navbarItems.map((item) => (
                <NavbarItem key={item.href} href={item.href} isActive={pathname === item.href}>
                  {item.children}
                </NavbarItem>
              ))}
            </div>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                {/* User Menu Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden md:flex items-center gap-1 text-parchment hover:text-gold-rich hover:bg-gold-rich/10"
                    >
                      <span className="font-lore italic">My Studio</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 glass-rune border-gold-ancient/30"
                  >
                    <DropdownMenuLabel className="text-parchment-dim font-lore">
                      Dashboard
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gold-ancient/20" />
                    {userMenuItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          className="flex items-center gap-2 text-parchment hover:text-gold-rich cursor-pointer"
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="font-lore">{item.children}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="bg-gold-ancient/20" />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/help"
                        className="flex items-center gap-2 text-parchment hover:text-gold-rich cursor-pointer"
                      >
                        <HelpCircle className="h-4 w-4" />
                        <span className="font-lore">Help</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Clerk User Button */}
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'w-8 h-8',
                      userButtonPopoverCard: 'glass-rune border-gold-ancient/30',
                      userButtonPopoverActionButton: 'text-parchment hover:bg-gold-ancient/20',
                      userButtonPopoverActionButtonText: 'text-parchment font-lore',
                    },
                  }}
                  afterSignOutUrl="/"
                />
              </div>
            ) : (
              <SignInButton>
                <Button
                  variant="outline"
                  size="sm"
                  className="ornate-border bg-gold-ancient/20 hover:bg-gold-ancient/30 text-gold-rich border-gold-ancient/30"
                >
                  Sign In
                </Button>
              </SignInButton>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center">
            <NavbarSidebar
              items={navbarItems}
              open={isSidebarOpen}
              onOpenChange={setIsSidebarOpen}
              user={user}
            />
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

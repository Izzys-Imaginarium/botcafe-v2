'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, Coffee } from 'lucide-react'
import { NavbarSidebar } from './navbar-sidebar'

interface NavbarItemProps {
  href: string
  children: React.ReactNode
  isActive?: boolean
}

const NavbarItem = ({ href, children, isActive }: NavbarItemProps) => {
  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        'text-sm font-lore italic text-foreground hover:text-primary transition-colors',
        isActive && 'text-primary',
      )}
    >
      <Link href={href}>{children}</Link>
    </Button>
  )
}

const navbarItems = [
  { href: '/', children: 'Home' },
  { href: '/explore', children: 'Explore' },
  { href: '/create', children: 'Create' },
]

interface NavbarProps {
  user?: { email: string } | null
}

export const Navbar = ({ user }: NavbarProps) => {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full z-50 border-b border-border/30 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <div className="absolute inset-0 border border-primary/50 rounded-full animate-[spin_12s_linear_infinite]"></div>
              <div className="absolute inset-1 border border-accent/50 rounded-full animate-[spin_8s_linear_infinite_reverse]"></div>
              <Coffee className="text-primary w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl text-foreground tracking-wider">
                Bot<span className="text-primary">Café</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 px-6 py-2 bg-secondary/40 rounded-full border border-border/20">
            {navbarItems.map((item) => (
              <NavbarItem key={item.href} href={item.href} isActive={pathname === item.href}>
                {item.children}
              </NavbarItem>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <span className="text-sm text-muted-foreground">{user.email}</span>
            ) : (
              <Button
                variant="ghost"
                className="font-display text-primary hover:text-foreground tracking-widest"
              >
                LOGIN
              </Button>
            )}
            <Button asChild>
              <Link href="/admin">Admin</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
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

'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavbarSidebarProps {
  items: { href: string; children: string }[]
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: { email: string } | null
}

export const NavbarSidebar = ({ items, open, onOpenChange, user }: NavbarSidebarProps) => {
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 bg-background border-border">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="font-display text-xl">
            Bot<span className="text-primary">Café</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 mt-6">
          {items.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={cn(
                'justify-start font-lore italic text-foreground hover:text-primary',
                pathname === item.href && 'text-primary bg-secondary/50',
              )}
              onClick={() => onOpenChange(false)}
            >
              <Link href={item.href}>{item.children}</Link>
            </Button>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-border absolute bottom-6 left-6 right-6">
          {user ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button asChild className="w-full">
                <Link href="/admin">Admin</Link>
              </Button>
            </div>
          ) : (
            <Button className="w-full font-display tracking-widest">LOGIN</Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

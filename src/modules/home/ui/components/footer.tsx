import Link from 'next/link'

const footerLinks = [
  { href: '/', label: 'Entrance' },
  { href: '/terms', label: 'Scrolls' },
  { href: '/privacy', label: 'Oaths' },
]

export const Footer = () => {
  return (
    <footer className="border-t border-border/20 py-8 text-center text-sm text-muted-foreground bg-background relative z-20">
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-muted-foreground/30 text-2xl mb-2">📖</span>
        <span className="font-lore italic">© 2024 BotCafé. Inscribed in the Digital Ether.</span>
        <div className="flex gap-8 mt-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              className="text-xs hover:text-primary uppercase tracking-widest transition-colors font-display"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}

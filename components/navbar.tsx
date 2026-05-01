'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, X, Zap } from 'lucide-react'

export function Navbar() {
  const [open, setOpen] = useState(false)

  const navLinks = [
    { href: '#servicios', label: 'Servicios' },
    { href: '#casos', label: 'Casos de éxito' },
    { href: '#nosotros', label: 'Nosotros' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/60">
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/logos/logo.png"
            alt="KokiHawk"
            width={140}
            height={38}
            className="object-contain h-8 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-all"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all h-9 px-5 text-sm"
          >
            <Link href="/login">
              <Zap className="h-3.5 w-3.5 mr-1.5 fill-primary-foreground" />
              Acceder a KokiHawk
            </Link>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl px-5 py-4 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-all"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-border/40 flex flex-col gap-2">
            <Button
              asChild
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20"
            >
              <Link href="/login" onClick={() => setOpen(false)}>
                <Zap className="h-3.5 w-3.5 mr-1.5 fill-primary-foreground" />
                Acceder a KokiHawk
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
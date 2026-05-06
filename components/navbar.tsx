'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, X, Zap } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export function Navbar() {
    const [open, setOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 12)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navLinks = [
        { href: '#servicios', label: 'Servicios' },
        { href: '#tutoriales', label: 'Tutoriales' },
        { href: '#casos', label: 'Casos de éxito' },
        { href: '#nosotros', label: 'Nosotros' },
    ]

    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
                    ? 'bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-sm shadow-black/5'
                    : 'bg-transparent border-b border-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-4">

                {/* LEFT: Logo */}
                <div className="flex items-center">
                    <Link href="/" className="group inline-flex">
                        <Image
                            src="/logos/logo.png"
                            alt="KokiHawk"
                            width={220}
                            height={58}
                            className="object-contain h-12 w-auto transition-all duration-200 group-hover:opacity-80"
                            priority
                        />
                    </Link>
                </div>

                {/* CENTER: Nav links */}
                <nav className="hidden md:flex items-center gap-1">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="relative px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-all duration-150 group"
                        >
                            {link.label}
                            <span className="absolute inset-x-4 bottom-0.5 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center rounded-full" />
                        </Link>
                    ))}
                </nav>

                {/* RIGHT: CTA or mobile toggle */}
                <div className="flex items-center justify-end gap-3">
                    <ThemeToggle />
                    <div className="hidden md:flex">
                        <Button
                            asChild
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 h-9 px-5 text-sm"
                        >
                            <Link href="/login">
                                <Zap className="h-3.5 w-3.5 mr-1.5 fill-primary-foreground" />
                                Acceder a KokiHawk
                            </Link>
                        </Button>
                    </div>
                    <button
                        onClick={() => setOpen(!open)}
                        className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                        aria-label="Menu"
                    >
                        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl px-5 py-4 space-y-1">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className="flex items-center px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-all"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="pt-3 border-t border-border/40">
                        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20">
                            <Link href="/login" onClick={() => setOpen(false)}>
                                <Zap className="h-3.5 w-3.5 mr-1.5 fill-primary-foreground" />
                                Acceder a KokiHawk
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
}

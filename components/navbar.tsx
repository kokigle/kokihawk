"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, Phone } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const navLinks = [
  { href: "#servicios", label: "Servicios" },
  { href: "#casos", label: "Casos reales" },
  { href: "#nosotros", label: "Quiénes somos" },
]

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur border-b border-border/60 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Kokihawk"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <span className="text-lg font-bold text-foreground tracking-tight">
            Kokihawk
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-5"
            asChild
          >
            <a href="https://wa.me/5491153695863" target="_blank" rel="noopener noreferrer">
              <Phone className="h-4 w-4 mr-2" />
              Hablar con nosotros
            </a>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Abrir menú"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-border/40 bg-background"
          >
            <div className="container mx-auto px-4 py-5 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Button className="bg-primary text-primary-foreground w-fit mt-1" asChild>
                <a href="https://wa.me/5491153695863" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)}>
                  Hablar con nosotros
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

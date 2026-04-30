"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle } from "lucide-react"

const benefits = [
  "Sin contratos largos ni letra chica",
  "Resultados visibles en semanas, no meses",
  "Soporte directo con el desarrollador",
]

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export function HeroSection() {
  return (
    <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
      {/* Subtle background gradient — no neon, no glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 relative">
        <div className="max-w-3xl mx-auto text-center">

          {/* Eyebrow label */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block text-sm font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              Automatización para empresas argentinas
            </span>
          </motion.div>

          {/* Main headline — plain language for the 50-65 yo owner */}
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Trabajá menos horas.<br />
            <span className="text-primary">Vendé más.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Desarrollamos sistemas a medida que hacen por vos lo que hoy hacés a mano:
            cargar facturas, actualizar precios, publicar en Mercado Libre y mucho más.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 h-12 text-base shadow-lg shadow-primary/20"
              asChild
            >
              <a href="https://wa.me/5491153695863" target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="mr-2 h-5 w-5" />
                Contanos tu problema
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border text-foreground hover:bg-secondary font-medium px-8 h-12 text-base"
              asChild
            >
              <a href="#casos">
                Ver casos reales
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </motion.div>

          {/* Social proof micro-list */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {benefits.map((b) => (
              <span key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                {b}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, CheckCircle2 } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pt-16 pb-20 md:pt-24 md:pb-32">

      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/6 blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-64 h-64 rounded-full bg-primary/4 blur-2xl pointer-events-none" />

      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, currentColor 60px, currentColor 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, currentColor 60px, currentColor 61px)`
      }} />

      <div className="relative max-w-7xl mx-auto px-5 md:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-8">

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-full px-4 py-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Sistema activo
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.05]">
            Actualizá tus precios<br />
            <span className="text-primary italic">en segundos,</span><br />
            no en horas.
          </h1>

          {/* Sub */}
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Subí tu lista de precios, mapeá las columnas una sola vez, y sincronizá con Mercado Libre y Tienda Nube con un clic.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xl shadow-primary/25 hover:shadow-primary/35 transition-all h-13 px-8 text-base w-full sm:w-auto"
            >
              <Link href="/login">
                <Zap className="h-4 w-4 mr-2 fill-primary-foreground" />
                Acceder a KokiHawk
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="font-semibold h-13 px-8 text-base w-full sm:w-auto border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <Link href="#servicios">
                Ver cómo funciona
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2">
            {[
              'Sin instalación requerida',
              'Compatible con cualquier lista',
              'Soporte en español',
            ].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>

          {/* Integration logos */}
          <div className="pt-4 flex flex-col items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
              Sincronización directa con
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-card border border-border/60 rounded-xl px-4 py-2.5 shadow-sm">
                <div className="w-6 h-6 rounded overflow-hidden bg-white flex items-center justify-center">
                  <Image src="/logos/meli.png" alt="Mercado Libre" width={20} height={20} className="object-contain" />
                </div>
                <span className="text-sm font-bold text-foreground">Mercado Libre</span>
              </div>
              <div className="text-muted-foreground/40 font-bold">+</div>
              <div className="flex items-center gap-2 bg-card border border-border/60 rounded-xl px-4 py-2.5 shadow-sm">
                <div className="w-6 h-6 rounded overflow-hidden bg-white flex items-center justify-center">
                  <Image src="/logos/tiendanube.png" alt="Tienda Nube" width={20} height={20} className="object-contain" />
                </div>
                <span className="text-sm font-bold text-foreground">Tienda Nube</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
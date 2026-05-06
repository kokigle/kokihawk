'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, CheckCircle2, Sparkles } from 'lucide-react'
import { motion, type TargetAndTransition, type Transition, type Variants } from 'framer-motion'

export function HeroSection() {
    const container: Variants = {
        hidden: {},
        show: {
            transition: { staggerChildren: 0.1, delayChildren: 0.3 }
        }
    }

    const item: Variants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } }
    }

    const float: TargetAndTransition = {
        y: ['-8px', '8px', '-8px'],
        transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
    }

    return (
        <section className="relative overflow-hidden bg-background pt-20 pb-24 md:pt-28 md:pb-40">

            {/* Animated background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Main glow */}
                <motion.div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/8 blur-3xl"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Secondary glows */}
                <motion.div
                    className="absolute top-1/4 right-0 w-72 h-72 rounded-full bg-primary/4 blur-2xl"
                    animate={float}
                />
                <motion.div
                    className="absolute bottom-0 left-1/4 w-56 h-56 rounded-full bg-red-400/3 blur-2xl"
                    animate={{ ...float, y: ['8px', '-8px', '8px'] }}
                />

                {/* Grid texture */}
                <div
                    className="absolute inset-0 opacity-[0.03] dark:opacity-[0.025]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, currentColor 60px, currentColor 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, currentColor 60px, currentColor 61px)`
                    }}
                />

                {/* Floating particles */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-primary/30"
                        style={{
                            left: `${15 + i * 15}%`,
                            top: `${20 + (i % 3) * 25}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.2, 0.6, 0.2],
                            scale: [0.5, 1.5, 0.5],
                        }}
                        transition={{
                            duration: 3 + i * 0.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: i * 0.4,
                        }}
                    />
                ))}
            </div>

            <div className="relative max-w-7xl mx-auto px-5 md:px-8">
                <motion.div
                    className="max-w-4xl mx-auto text-center space-y-10"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >

                    {/* Status badge */}
                    <motion.div variants={item} className="flex justify-center">
                        <div className="inline-flex items-center gap-2.5 bg-primary/10 border border-primary/25 rounded-full px-5 py-2 text-xs font-semibold text-primary uppercase tracking-wider shadow-lg shadow-primary/5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                            </span>
                            Sistema activo
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.div variants={item} className="space-y-2">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground tracking-tight leading-[1.05]">
                            Actualizá tus precios
                            <br />
                            <span className="relative inline-block">
                                <span className="text-primary italic">en segundos,</span>
                                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                                    <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/30" />
                                </svg>
                            </span>
                            <br />
                            no en horas.
                        </h1>
                    </motion.div>

                    {/* Sub */}
                    <motion.p variants={item} className="text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
                        Subí tu lista de precios, mapeá las columnas una sola vez, y sincronizá con{' '}
                        <span className="text-foreground font-semibold">Mercado Libre</span> y{' '}
                        <span className="text-foreground font-semibold">Tienda Nube</span> con un clic.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            asChild
                            size="lg"
                            className="group bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-2xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 h-14 px-10 text-base w-full sm:w-auto"
                        >
                            <Link href="/login">
                                <Zap className="h-4 w-4 mr-2 fill-primary-foreground group-hover:scale-110 transition-transform" />
                                Acceder a KokiHawk
                                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="font-semibold h-14 px-10 text-base w-full sm:w-auto border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                        >
                            <Link href="#tutoriales">
                                Ver tutoriales
                            </Link>
                        </Button>
                    </motion.div>

                    {/* Trust indicators */}
                    <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-2">
                        {[
                            'Sin instalación requerida',
                            'Compatible con cualquier lista',
                            'Soporte en español',
                        ].map(item => (
                            <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                {item}
                            </div>
                        ))}
                    </motion.div>

                    {/* Integration logos */}
                    <motion.div variants={item} className="pt-6 flex flex-col items-center gap-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-primary/60" />
                            Sincronización directa con
                        </p>
                        <div className="flex items-center gap-5">
                            <motion.div
                                whileHover={{ scale: 1.05, y: -2 }}
                                className="flex items-center gap-2.5 bg-card border border-border/60 rounded-xl px-5 py-3 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300"
                            >
                                <div className="w-7 h-7 rounded-lg overflow-hidden bg-white flex items-center justify-center border border-border/20">
                                    <Image src="/logos/meli.png" alt="Mercado Libre" width={28} height={28} style={{ width: 'auto', height: 'auto' }} className="object-contain" />
                                </div>
                                <span className="text-sm font-bold text-foreground">Mercado Libre</span>
                            </motion.div>
                            <div className="text-muted-foreground/30 font-bold text-lg">+</div>
                            <motion.div
                                whileHover={{ scale: 1.05, y: -2 }}
                                className="flex items-center gap-2.5 bg-card border border-border/60 rounded-xl px-5 py-3 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300"
                            >
                                <div className="w-7 h-7 rounded-lg overflow-hidden bg-white flex items-center justify-center border border-border/20">
                                    <Image src="/logos/tiendanube.png" alt="Tienda Nube" width={28} height={28} style={{ width: 'auto', height: 'auto' }} className="object-contain" />
                                </div>
                                <span className="text-sm font-bold text-foreground">Tienda Nube</span>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}

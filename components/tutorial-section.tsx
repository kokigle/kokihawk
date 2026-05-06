'use client'

import { motion } from 'framer-motion'
import { BookOpen, Play, ChevronRight } from 'lucide-react'

const tutorials = [
    {
        step: '01',
        title: 'Conectá tus plataformas',
        description: 'Vinculá Mercado Libre y Tienda Nube en segundos. Sin configuraciones complejas.',
        videoId: 'hWPHWfYe4PM',
        accent: 'bg-blue-500/10',
        accentText: 'text-blue-600 dark:text-blue-400',
        accentBorder: 'border-blue-500/20',
    },
    {
        step: '02',
        title: 'Subí y calculá precios',
        description: 'Cargá tu lista de precios, mapeá columnas y aplicá reglas de cálculo automáticas.',
        videoId: '97gGdSZaGi0',
        accent: 'bg-primary/10',
        accentText: 'text-primary',
        accentBorder: 'border-primary/20',
    },
    {
        step: '03',
        title: 'Historial y Catálogo',
        description: 'Consultá el historial de cambios y buscá productos al instante por SKU o código de barras.',
        videoId: 'TANnAXsZaEY',
        accent: 'bg-emerald-500/10',
        accentText: 'text-emerald-600 dark:text-emerald-400',
        accentBorder: 'border-emerald-500/20',
    },
]

export function TutorialSection() {
    return (
        <section id="tutoriales" className="relative py-20 md:py-28 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-5 md:px-8">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                        <BookOpen className="h-3.5 w-3.5" />
                        Tutoriales
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-4">
                        Aprendé a usar <span className="text-primary italic">KokiHawk</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Videos cortos y prácticos para que empieces a actualizar tus precios en minutos.
                    </p>
                </motion.div>

                {/* Video cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {tutorials.map((t, i) => (
                        <motion.div
                            key={t.step}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.12, duration: 0.5 }}
                            className="group"
                        >
                            <div className="h-full flex flex-col bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                                {/* Video */}
                                <div className="relative aspect-video bg-black">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${t.videoId}?rel=0&modestbranding=1`}
                                        title={t.title}
                                        className="absolute inset-0 w-full h-full"
                                        allowFullScreen
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded-lg ${t.accent} flex items-center justify-center`}>
                                            <span className={`text-[10px] font-black ${t.accentText}`}>{t.step}</span>
                                        </div>
                                        <h3 className="text-sm font-bold text-foreground">{t.title}</h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                                </div>

                                {/* Bottom accent line */}
                                <div className={`h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    className="text-center mt-12"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <a
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                        Accedé a KokiHawk para empezar
                        <ChevronRight className="h-4 w-4" />
                    </a>
                </motion.div>
            </div>
        </section>
    )
}

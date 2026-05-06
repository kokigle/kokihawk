'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, BookOpen, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const tutorials = [
    {
        id: 'paso-0',
        step: 'Paso 0',
        title: 'Módulo Integraciones',
        description: 'Conectá Mercado Libre y Tienda Nube para empezar a sincronizar precios.',
        videoId: 'hWPHWfYe4PM',
        accent: 'bg-blue-500/10',
        accentText: 'text-blue-600 dark:text-blue-400',
        accentBorder: 'border-blue-500/20',
    },
    {
        id: 'paso-1',
        step: 'Paso 1',
        title: 'Módulo Motor de Listas',
        description: 'Subí tu Excel, mapeá columnas y calculá precios masivos con reglas personalizadas.',
        videoId: '97gGdSZaGi0',
        accent: 'bg-primary/10',
        accentText: 'text-primary',
        accentBorder: 'border-primary/20',
    },
    {
        // https://www.youtube.com/watch?v=TANnaxsZaEY
        id: 'paso-3',
        step: 'Paso 3',
        title: 'Módulo Historial y Catálogo',
        description: 'Revisá el historial de sincronizaciones y consultá productos al instante.',
        videoId: 'TANnaxsZaEY',
        accent: 'bg-emerald-500/10',
        accentText: 'text-emerald-600 dark:text-emerald-400',
        accentBorder: 'border-emerald-500/20',
    },
]

export function TutorialVideos() {
    const [expandedVideo, setExpandedVideo] = useState<string | null>(null)

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-black text-foreground">Tutoriales rápidos</p>
                    <p className="text-[10px] text-muted-foreground">Aprendé a usar KokiHawk en minutos</p>
                </div>
            </div>

            <div className="space-y-2">
                {tutorials.map((t, i) => (
                    <div key={t.id}>
                        <button
                            onClick={() => setExpandedVideo(expandedVideo === t.id ? null : t.id)}
                            className={`group w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${expandedVideo === t.id
                                ? `${t.accent} ${t.accentBorder} border`
                                : 'border-border/50 bg-card hover:border-primary/30 hover:bg-primary/3'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-lg ${t.accent} flex items-center justify-center flex-shrink-0`}>
                                <span className={`text-[10px] font-black ${t.accentText}`}>{t.step.replace('Paso ', '')}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">{t.title}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{t.description}</p>
                            </div>
                            <Play className={`h-3.5 w-3.5 flex-shrink-0 transition-all ${expandedVideo === t.id
                                ? 'text-primary scale-110'
                                : 'text-muted-foreground/40 group-hover:text-primary'
                                }`} />
                        </button>

                        <AnimatePresence>
                            {expandedVideo === t.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-2 pb-1 px-1">
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${t.videoId}?rel=0`}
                                                title={t.title}
                                                className="absolute inset-0 w-full h-full"
                                                allowFullScreen
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function TutorialModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card border border-border/60 rounded-2xl shadow-2xl"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4 bg-card border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-foreground">Bienvenido a KokiHawk</h2>
                            <p className="text-xs text-muted-foreground">Aprendé a usar la plataforma en minutos</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Welcome text */}
                    <div className="bg-primary/5 border border-primary/15 rounded-xl p-5">
                        <p className="text-sm text-foreground leading-relaxed">
                            KokiHawk te permite actualizar precios en <strong>Mercado Libre</strong> y <strong>Tienda Nube</strong> de forma automática.
                            Seguí estos pasos para empezar:
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="space-y-4">
                        {tutorials.map((t, i) => (
                            <div key={t.id} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full ${t.accent} flex items-center justify-center`}>
                                        <span className={`text-[10px] font-black ${t.accentText}`}>{t.step.replace('Paso ', '')}</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-foreground">{t.title}</h3>
                                </div>
                                <p className="text-xs text-muted-foreground ml-8">{t.description}</p>
                                <div className="ml-8 relative w-full aspect-video rounded-xl overflow-hidden bg-black">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${t.videoId}?rel=0`}
                                        title={t.title}
                                        className="absolute inset-0 w-full h-full"
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                        <p className="text-xs text-muted-foreground">¿Necesitás ayuda? Escribinos por WhatsApp</p>
                        <Button
                            onClick={onClose}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
                        >
                            Empezar ahora
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

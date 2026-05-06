import React from 'react'
import Image from 'next/image'
import { CheckCircle2, ChevronRight, Lock, Link2, AlertTriangle, DatabaseZap, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

/* ─────────────────────────────────────────
   StepIndicator  — linear progress tracker
───────────────────────────────────────── */
export function StepIndicator({ step }: { step: number }) {
    const steps = [
        { num: 1, label: 'Subir archivo' },
        { num: 2, label: 'Mapear columnas' },
        { num: 3, label: 'Revisar y sincronizar' },
    ]
    return (
        <div className="flex items-center gap-0">
            {steps.map((s, i) => (
                <div key={s.num} className="flex items-center">
                    <div className="flex items-center gap-2.5">
                        {/* Circle */}
                        <div className={`relative w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ring-2 ring-offset-2 ring-offset-background
              ${step === s.num ? 'bg-primary text-primary-foreground ring-primary/40 scale-110' : ''}
              ${step > s.num ? 'bg-primary/20 text-primary ring-transparent' : ''}
              ${step < s.num ? 'bg-muted/50 text-muted-foreground ring-transparent' : ''}
            `}>
                            {step > s.num
                                ? <CheckCircle2 className="h-3.5 w-3.5" />
                                : s.num}
                            {step === s.num && (
                                <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                            )}
                        </div>
                        {/* Label */}
                        <span className={`text-xs font-semibold hidden sm:block transition-colors ${step === s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {s.label}
                        </span>
                    </div>
                    {/* Connector line */}
                    {i < steps.length - 1 && (
                        <div className="relative mx-3 flex-shrink-0 w-10 h-px">
                            <div className="absolute inset-0 bg-border rounded-full" />
                            <div
                                className="absolute inset-0 bg-primary rounded-full transition-all duration-500 origin-left"
                                style={{ transform: `scaleX(${step > i + 1 ? 1 : 0})` }}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

/* ─────────────────────────────────────────
   MappingButton  — column selector chip
───────────────────────────────────────── */
export function MappingButton({ label, color, active, onClick, autoDetected }: {
    label: string; color: string; active: boolean; onClick: () => void; autoDetected?: boolean
}) {
    const colorMap: Record<string, string> = {
        blue: active
            ? 'bg-blue-500 text-white border-blue-500 shadow-blue-500/30 shadow-md'
            : 'border-border/60 text-muted-foreground hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/8',
        green: active
            ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/30 shadow-md'
            : 'border-border/60 text-muted-foreground hover:border-emerald-600 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/8',
        orange: active
            ? 'bg-primary text-primary-foreground border-primary shadow-primary/30 shadow-md'
            : 'border-border/60 text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/8',
    }
    return (
        <button
            onClick={onClick}
            className={`relative text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md border transition-all duration-150 cursor-pointer ${colorMap[color]} ${autoDetected && !active ? 'ring-1 ring-emerald-400/60 border-emerald-400/40' : ''}`}
        >
            {label}
            {autoDetected && !active && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 border border-emerald-200 shadow-sm shadow-emerald-400/30" />
            )}
        </button>
    )
}

/* ─────────────────────────────────────────
   PlatformBadges  — MeLi / TN chips
───────────────────────────────────────── */
export function PlatformBadges({ plataformas }: { plataformas?: string[] }) {
    if (!plataformas || plataformas.length === 0)
        return <span className="text-[10px] text-muted-foreground/30 italic select-none">—</span>
    return (
        <div className="flex items-center gap-1 flex-wrap justify-center">
            {plataformas.includes('meli') && (
                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 rounded-md px-1.5 py-0.5">
                    <div className="w-3 h-3 rounded-sm overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                        <Image src="/logos/meli.png" alt="MeLi" width={12} height={12} className="object-contain w-3 h-3" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wide text-amber-500">ML</span>
                </div>
            )}
            {plataformas.includes('tn') && (
                <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/25 rounded-md px-1.5 py-0.5">
                    <div className="w-3 h-3 rounded-sm overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                        <Image src="/logos/tiendanube.png" alt="TN" width={12} height={12} className="object-contain w-3 h-3" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wide text-blue-500">TN</span>
                </div>
            )}
        </div>
    )
}

/* ─────────────────────────────────────────
   IntegrationCard  — platform connection row
───────────────────────────────────────── */
export function IntegrationCard({ logo, name, connected, onConnect }: {
    logo: string; name: string; connected: boolean; onConnect: () => void
}) {
    return (
        <div className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${connected
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-secondary/30 border-border/60 hover:border-border'
            }`}>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm border border-border/20 flex items-center justify-center flex-shrink-0">
                    <Image src={logo} alt={name} width={30} height={30} className="object-contain w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm font-bold text-foreground">{name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-muted-foreground/30'}`} />
                        <p className={`text-xs font-semibold ${connected ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                            {connected ? 'Conectado' : 'Sin vincular'}
                        </p>
                    </div>
                </div>
            </div>
            {!connected
                ? (
                    <Button size="sm" variant="outline" onClick={onConnect}
                        className="text-xs font-bold gap-1.5 border-border/60 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all">
                        <Link2 className="h-3 w-3" /> Conectar
                    </Button>
                )
                : (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Activo</span>
                    </div>
                )
            }
        </div>
    )
}

/* ─────────────────────────────────────────
   ModuleCard  — hub card grid item
───────────────────────────────────────── */
export function ModuleCard({
    icon, title, description, locked, onClick, accentColor, footer, topRight
}: {
    icon: React.ReactNode; title: string; description: string
    locked?: boolean; onClick?: () => void; accentColor: string
    footer?: React.ReactNode; topRight?: React.ReactNode
}) {
    return (
        <button
            onClick={locked ? undefined : onClick}
            disabled={locked}
            className={`group relative text-left w-full rounded-2xl border bg-card overflow-hidden transition-all duration-300
        ${locked
                    ? 'opacity-55 cursor-not-allowed border-border/40'
                    : 'hover:border-primary/35 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-0.5 cursor-pointer border-border/60 active:translate-y-0 active:shadow-md'
                }`}
        >
            {/* Hover glow overlay */}
            {!locked && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            )}

            {/* Top accent line */}
            {!locked && (
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}

            <div className="relative z-10 p-6 space-y-4">
                <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${accentColor}`}>
                        {icon}
                    </div>
                    <div className="flex items-center gap-2">
                        {topRight}
                        {locked
                            ? (
                                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1">
                                    <Lock className="h-3 w-3 text-amber-500" />
                                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-500">Próximamente</span>
                                </div>
                            )
                            : (
                                <div className="w-7 h-7 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:border-primary/30">
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                </div>
                            )
                        }
                    </div>
                </div>
                <div className="space-y-1.5">
                    <h3 className="font-black text-foreground tracking-tight text-base leading-snug">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
                {footer && (
                    <div className="pt-3 border-t border-border/40">
                        {footer}
                    </div>
                )}
            </div>
        </button>
    )
}

/* ─────────────────────────────────────────
   HistorialMockup  — locked module preview
───────────────────────────────────────── */
export function HistorialMockup() {
    return (
        <div className="space-y-1.5 pointer-events-none select-none">
            {[
                { color: 'bg-emerald-400', text: '312 productos · hace 2h', dot: 'emerald' },
                { color: 'bg-blue-400', text: 'TN: 308 actualizados · ayer', dot: 'blue' },
                { color: 'bg-amber-400', text: 'MeLi: 300 actualizados · ayer', dot: 'amber' },
            ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/30 border border-border/25 rounded-lg px-2.5 py-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.color} flex-shrink-0`} />
                    <span className="text-[10px] text-muted-foreground/70 font-medium truncate">{item.text}</span>
                </div>
            ))}
        </div>
    )
}

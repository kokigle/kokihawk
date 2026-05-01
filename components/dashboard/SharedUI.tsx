import React from 'react'
import Image from 'next/image'
import { CheckCircle2, ChevronRight, Lock, Link2, AlertTriangle, DatabaseZap, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function StepIndicator({ step }: { step: number }) {
    const steps = [
        { num: 1, label: 'Subir archivo' },
        { num: 2, label: 'Mapear columnas' },
        { num: 3, label: 'Revisar y sincronizar' },
    ]
    return (
        <div className="flex items-center">
            {steps.map((s, i) => (
                <div key={s.num} className="flex items-center">
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${step === s.num ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110' : ''} ${step > s.num ? 'bg-primary/20 text-primary' : ''} ${step < s.num ? 'bg-muted text-muted-foreground' : ''}`}>
                            {step > s.num ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.num}
                        </div>
                        <span className={`text-xs font-semibold hidden sm:block transition-colors ${step === s.num ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
                    </div>
                    {i < steps.length - 1 && <ChevronRight className={`h-3.5 w-3.5 mx-3 flex-shrink-0 transition-colors ${step > i + 1 ? 'text-primary' : 'text-border'}`} />}
                </div>
            ))}
        </div>
    )
}

export function MappingButton({ label, color, active, onClick }: { label: string; color: string; active: boolean; onClick: () => void }) {
    const colorMap: Record<string, string> = {
        blue: active ? 'bg-blue-500 text-white border-blue-500 shadow-blue-500/25 shadow-md' : 'border-border text-muted-foreground hover:border-blue-400 hover:text-blue-400 hover:bg-blue-500/5',
        green: active ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/25 shadow-md' : 'border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-400 hover:bg-emerald-500/5',
        orange: active ? 'bg-primary text-primary-foreground border-primary shadow-primary/25 shadow-md' : 'border-border text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/5',
    }
    return (
        <button onClick={onClick} className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md border transition-all cursor-pointer ${colorMap[color]}`}>{label}</button>
    )
}

export function PlatformBadges({ plataformas }: { plataformas?: string[] }) {
    if (!plataformas || plataformas.length === 0) return <span className="text-[10px] text-muted-foreground/40 italic">—</span>
    return (
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {plataformas.includes('meli') && (
                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-md px-1.5 py-0.5">
                    <div className="w-3.5 h-3.5 rounded-sm overflow-hidden bg-white flex items-center justify-center flex-shrink-0"><Image src="/logos/meli.png" alt="MeLi" width={12} height={12} className="object-contain" /></div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">MeLi</span>
                </div>
            )}
            {plataformas.includes('tn') && (
                <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 rounded-md px-1.5 py-0.5">
                    <div className="w-3.5 h-3.5 rounded-sm overflow-hidden bg-white flex items-center justify-center flex-shrink-0"><Image src="/logos/tiendanube.png" alt="TN" width={12} height={12} className="object-contain" /></div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">TN</span>
                </div>
            )}
        </div>
    )
}

export function IntegrationCard({ logo, name, connected, onConnect }: { logo: string; name: string; connected: boolean; onConnect: () => void }) {
    return (
        <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${connected ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-card border-border'}`}>
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-white shadow-sm border border-border/30 flex items-center justify-center"><Image src={logo} alt={name} width={28} height={28} className="object-contain" /></div>
                <div>
                    <p className="text-sm font-bold text-foreground">{name}</p>
                    <p className={`text-xs font-medium ${connected ? 'text-emerald-500' : 'text-muted-foreground'}`}>{connected ? '✓ Conectado' : 'Sin vincular'}</p>
                </div>
            </div>
            {!connected ? <Button size="sm" variant="outline" onClick={onConnect} className="text-xs font-bold gap-1.5"><Link2 className="h-3 w-3" /> Conectar</Button> : <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />}
        </div>
    )
}

export function ModuleCard({ icon, title, description, locked, onClick, accentColor, footer, topRight }: { icon: React.ReactNode; title: string; description: string; locked?: boolean; onClick?: () => void; accentColor: string; footer?: React.ReactNode; topRight?: React.ReactNode }) {
    return (
        <button onClick={locked ? undefined : onClick} disabled={locked} className={`group relative text-left w-full rounded-2xl border bg-card p-6 transition-all duration-300 overflow-hidden ${locked ? 'opacity-60 cursor-not-allowed border-border/50' : 'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 cursor-pointer border-border'}`}>
            {!locked && <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />}
            <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${accentColor}`}>{icon}</div>
                    <div className="flex items-center gap-2">
                        {topRight}
                        {locked && (
                            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1">
                                <Lock className="h-3 w-3 text-amber-500" />
                                <span className="text-[9px] font-black uppercase tracking-wider text-amber-500">Próximamente</span>
                            </div>
                        )}
                        {!locked && <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />}
                    </div>
                </div>
                <div className="space-y-1.5">
                    <h3 className="font-black text-foreground tracking-tight">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
                {footer && <div className="pt-3 border-t border-border/40">{footer}</div>}
            </div>
        </button>
    )
}

export function HistorialMockup() {
    return (
        <div className="space-y-1.5 pointer-events-none select-none">
            {[{ color: 'bg-emerald-400', text: '312 productos · hace 2h' }, { color: 'bg-blue-400', text: 'TN: 308 actualizados · ayer' }, { color: 'bg-amber-400', text: 'MeLi: 300 actualizados · ayer' }].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/40 border border-border/30 rounded-lg px-2.5 py-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.color} flex-shrink-0`} />
                    <span className="text-[10px] text-muted-foreground/80 font-medium truncate">{item.text}</span>
                </div>
            ))}
        </div>
    )
}
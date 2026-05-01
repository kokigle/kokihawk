'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import {
    LogOut, FileSpreadsheet, Store, Package, History,
    ChevronRight, TrendingUp, RefreshCw, Zap, ArrowRight
} from 'lucide-react'
import { ModuleCard, HistorialMockup } from '@/components/dashboard/SharedUI'
import MotorModule from '@/components/dashboard/MotorModule'
import CatalogoModule from '@/components/dashboard/CatalogoModule'
import IntegracionesModule from '@/components/dashboard/IntegracionesModule'

/* Connection status pill */
function ConnPill({ logo, name, connected }: { logo: string; name: string; connected: boolean }) {
    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${connected ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-secondary/40 border-border/50'}`}>
            <div className="w-5 h-5 rounded-md overflow-hidden bg-white flex items-center justify-center flex-shrink-0 border border-border/20">
                <Image src={logo} alt={name} width={14} height={14} className="object-contain" />
            </div>
            <span className="text-xs font-bold text-foreground hidden sm:inline">{name}</span>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${connected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/60' : 'bg-muted-foreground/30'}`} />
        </div>
    )
}

/* Quick-action card */
function QuickAction({ icon, label, sublabel, onClick, accent }: { icon: React.ReactNode; label: string; sublabel: string; onClick: () => void; accent: string }) {
    return (
        <button onClick={onClick}
            className="group flex items-center gap-3 w-full p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:bg-primary/3 transition-all duration-200 text-left">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{sublabel}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>
    )
}

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null)
    const [activeModule, setActiveModule] = useState('hub')
    const [step, setStep] = useState(1)
    const [integraciones, setIntegraciones] = useState<any>(null)

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }
            setUser(user)

            const params = new URLSearchParams(window.location.search)
            let needsRefetch = false

            const tnToken = params.get('tn_token')
            const tnStore = params.get('tn_store')
            if (tnToken && tnStore) {
                await supabase.from('integraciones_api').upsert({ user_id: user.id, tiendanube_access_token: tnToken, tiendanube_store_id: tnStore, updated_at: new Date().toISOString() })
                alert('¡Tienda Nube vinculada con éxito!')
                needsRefetch = true
            }
            const meliToken = params.get('meli_token')
            const meliRefresh = params.get('meli_refresh')
            if (meliToken) {
                await supabase.from('integraciones_api').upsert({ user_id: user.id, meli_access_token: meliToken, meli_refresh_token: meliRefresh, updated_at: new Date().toISOString() })
                alert('¡Mercado Libre vinculado con éxito!')
                needsRefetch = true
            }
            if (needsRefetch) window.history.replaceState(null, '', '/dashboard')

            const { data: ints } = await supabase.from('integraciones_api').select('*').eq('user_id', user.id).single()
            if (ints) setIntegraciones(ints)
        }
        init()
    }, [router, supabase])

    const userName = user?.email?.split('@')[0] ?? 'Usuario'
    const userInitial = userName.charAt(0).toUpperCase()

    const moduleLabel: Record<string, string> = {
        motor: 'Motor de Listas',
        integraciones: 'Integraciones',
        catalogo: 'Catálogo de Mostrador',
    }

    const bothConnected = integraciones?.meli_access_token && integraciones?.tiendanube_access_token
    const noneConnected = !integraciones?.meli_access_token && !integraciones?.tiendanube_access_token

    return (
        <div className="min-h-screen bg-background flex flex-col">

            {/* ── Navbar ── */}
            <nav className="bg-card/70 backdrop-blur-xl border-b border-border/60 px-4 md:px-8 flex justify-between items-center sticky top-0 z-50 h-16 shadow-sm shadow-black/10">
                <div className="flex items-center gap-3">
                    <Image src="/logos/logo.png" alt="KokiHawk" width={160} height={44} className="object-contain h-9 w-auto" />
                    {activeModule !== 'hub' && (
                        <>
                            <div className="h-4 w-px bg-border hidden sm:block" />
                            <button onClick={() => setActiveModule('hub')}
                                className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary border border-border/50 rounded-lg px-3 py-1.5 transition-all">
                                <ChevronRight className="h-3 w-3 rotate-180" />
                                {moduleLabel[activeModule]}
                            </button>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
                        className="text-muted-foreground hover:text-red-400 hover:bg-red-500/8 gap-1.5 h-8 transition-colors"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline text-xs">Salir</span>
                    </Button>
                </div>
            </nav>

            {/* ── Main ── */}
            <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto">

                {/* ════ HUB ════ */}
                {activeModule === 'hub' && (
                    <div className="space-y-6 mt-2 md:mt-4">

                        {/* ── Hero welcome banner ── */}
                        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card">
                            {/* BG decoration */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/6 rounded-full blur-3xl" />
                                <div className="absolute -bottom-10 left-1/4 w-56 h-56 bg-primary/4 rounded-full blur-2xl" />
                                {/* Grid */}
                                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 32px, currentColor 32px, currentColor 33px), repeating-linear-gradient(90deg, transparent, transparent 32px, currentColor 32px, currentColor 33px)` }} />
                            </div>

                            <div className="relative z-10 p-6 md:p-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    {/* Left: greeting */}
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/10">
                                            <span className="text-2xl font-black text-primary">{userInitial}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/60" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Sistema activo</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground font-medium">Bienvenido de vuelta,</p>
                                            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-tight">{userName}</h1>
                                        </div>
                                    </div>

                                    {/* Right: connection status */}
                                    <div className="flex flex-col gap-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado de conexiones</p>
                                        <div className="flex flex-wrap gap-2">
                                            <ConnPill logo="/logos/meli.png" name="Mercado Libre" connected={!!integraciones?.meli_access_token} />
                                            <ConnPill logo="/logos/tiendanube.png" name="Tienda Nube" connected={!!integraciones?.tiendanube_access_token} />
                                        </div>
                                        {noneConnected && (
                                            <button onClick={() => setActiveModule('integraciones')}
                                                className="text-[10px] font-bold text-primary/70 hover:text-primary text-left flex items-center gap-1 transition-colors">
                                                <Zap className="h-3 w-3" /> Conectar plataformas →
                                            </button>
                                        )}
                                        {bothConnected && (
                                            <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3" /> Listo para sincronizar
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── 2-column layout: modules + sidebar ── */}
                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

                            {/* LEFT: modules */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Módulos disponibles</h2>
                                    <div className="flex-1 h-px bg-border/40" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <ModuleCard
                                        icon={<FileSpreadsheet className="h-5 w-5 text-primary" />}
                                        title="Motor de Listas"
                                        description="Subí tu Excel, mapeá columnas y calculá precios masivos con un clic."
                                        accentColor="bg-primary/10"
                                        onClick={() => { setActiveModule('motor'); setStep(1) }}
                                    />
                                    <ModuleCard
                                        icon={<Package className="h-5 w-5 text-violet-400" />}
                                        title="Catálogo de Mostrador"
                                        description="Buscá cualquier producto por SKU o escaneá su código de barras al instante."
                                        accentColor="bg-violet-500/10"
                                        onClick={() => setActiveModule('catalogo')}
                                    />
                                    <ModuleCard
                                        icon={<Store className="h-5 w-5 text-blue-400" />}
                                        title="Integraciones"
                                        description="Vinculá MeLi, Tienda Nube y cargá diccionarios de SKU para traducción automática."
                                        accentColor="bg-blue-500/10"
                                        onClick={() => setActiveModule('integraciones')}
                                    />
                                    <ModuleCard
                                        icon={<History className="h-5 w-5 text-emerald-400" />}
                                        title="Historial y Logs"
                                        description="Registro completo de sincronizaciones, errores y auditoría de cambios."
                                        accentColor="bg-emerald-500/10"
                                        locked
                                        footer={<HistorialMockup />}
                                    />
                                </div>
                            </div>

                            {/* RIGHT: sidebar */}
                            <div className="space-y-5">
                                {/* Quick actions */}
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Acciones rápidas</h2>
                                        <div className="flex-1 h-px bg-border/40" />
                                    </div>
                                    <div className="space-y-2">
                                        <QuickAction
                                            icon={<FileSpreadsheet className="h-4.5 w-4.5 text-primary" />}
                                            label="Nueva lista de precios"
                                            sublabel="Subir y calcular precios"
                                            onClick={() => { setActiveModule('motor'); setStep(1) }}
                                            accent="bg-primary/10"
                                        />
                                        <QuickAction
                                            icon={<Package className="h-4.5 w-4.5 text-violet-400" />}
                                            label="Buscar en catálogo"
                                            sublabel="Consultar precio al instante"
                                            onClick={() => setActiveModule('catalogo')}
                                            accent="bg-violet-500/10"
                                        />
                                        <QuickAction
                                            icon={<RefreshCw className="h-4.5 w-4.5 text-blue-400" />}
                                            label="Gestionar conexiones"
                                            sublabel="MeLi, Tienda Nube y SKUs"
                                            onClick={() => setActiveModule('integraciones')}
                                            accent="bg-blue-500/10"
                                        />
                                    </div>
                                </div>

                                {/* Info / tips card */}
                                <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                            <Zap className="h-4 w-4 text-primary" />
                                        </div>
                                        <p className="text-sm font-black text-foreground">Flujo recomendado</p>
                                    </div>
                                    <ol className="space-y-3">
                                        {[
                                            { n: '1', text: 'Conectá tus plataformas en Integraciones' },
                                            { n: '2', text: 'Subí tu lista Excel en el Motor de Listas' },
                                            { n: '3', text: 'Revisá los precios y sincronizá con un clic' },
                                            { n: '4', text: 'Consultá el Catálogo de Mostrador desde el local' },
                                        ].map(step => (
                                            <li key={step.n} className="flex items-start gap-3">
                                                <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</span>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{step.text}</p>
                                            </li>
                                        ))}
                                    </ol>
                                </div>

                                {/* Brand footer card */}
                                <div className="relative overflow-hidden bg-card border border-border/50 rounded-2xl p-5">
                                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/8 rounded-full blur-xl" />
                                    <div className="relative flex items-center gap-3">
                                        <Image src="/logos/logo.png" alt="KokiHawk" width={100} height={28} className="object-contain h-7 w-auto opacity-70" />
                                    </div>
                                    <p className="relative text-[10px] text-muted-foreground/60 mt-3 leading-relaxed">
                                        KokiHawk automatiza la actualización de precios en Mercado Libre y Tienda Nube. Desarrollado en Argentina 🇦🇷
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════ MODULE VIEWS ════ */}
                {activeModule === 'motor' && user && (
                    <MotorModule user={user} integraciones={integraciones} setIntegraciones={setIntegraciones} setActiveModule={setActiveModule} step={step} setStep={setStep} />
                )}
                {activeModule === 'catalogo' && user && (
                    <CatalogoModule userId={user.id} setActiveModule={setActiveModule} />
                )}
                {activeModule === 'integraciones' && (
                    <IntegracionesModule integraciones={integraciones} setActiveModule={setActiveModule} />
                )}
            </main>
        </div>
    )
}
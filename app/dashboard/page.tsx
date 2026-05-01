'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { LogOut, FileSpreadsheet, Store, Package, History } from 'lucide-react'
import { ModuleCard, HistorialMockup } from '@/components/dashboard/SharedUI'
import MotorModule from '@/components/dashboard/MotorModule'
import CatalogoModule from '@/components/dashboard/CatalogoModule'
import IntegracionesModule from '@/components/dashboard/IntegracionesModule'

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

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <nav className="bg-card/80 backdrop-blur-xl border-b border-border px-5 md:px-8 flex justify-between items-center sticky top-0 z-50 h-16">
                <div className="flex items-center gap-4">
                    <Image src="/logos/logo.png" alt="KokiHawk" width={120} height={32} className="object-contain h-8 w-auto" />
                    {activeModule !== 'hub' && <div className="h-5 w-px bg-border hidden sm:block" />}
                    {activeModule === 'motor' && <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-muted-foreground"><FileSpreadsheet className="h-3.5 w-3.5" /> Motor de Listas</div>}
                    {activeModule === 'integraciones' && <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Store className="h-3.5 w-3.5" /> Integraciones</div>}
                    {activeModule === 'catalogo' && <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Package className="h-3.5 w-3.5" /> Catálogo de Mostrador</div>}
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="text-muted-foreground hover:text-foreground gap-1.5 h-8">
                        <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline text-xs">Salir</span>
                    </Button>
                </div>
            </nav>

            <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto">
                {activeModule === 'hub' && (
                    <div className="space-y-10 mt-4 md:mt-6">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground font-medium">Bienvenido de vuelta,</p>
                                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{userName} 👋</h1>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Módulos disponibles</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <ModuleCard icon={<FileSpreadsheet className="h-5 w-5 text-primary" />} title="Motor de Listas" description="Subí Excel, mapeá y calculá precios." accentColor="bg-primary/10" onClick={() => { setActiveModule('motor'); setStep(1) }} />
                                <ModuleCard icon={<Package className="h-5 w-5 text-violet-500" />} title="Catálogo Mostrador" description="Consultá precios al instante." accentColor="bg-violet-500/10" onClick={() => setActiveModule('catalogo')} />
                                <ModuleCard icon={<Store className="h-5 w-5 text-blue-500" />} title="Integraciones" description="MeLi, Tienda Nube y Diccionarios de SKU." accentColor="bg-blue-500/10" onClick={() => setActiveModule('integraciones')} />
                                <ModuleCard icon={<History className="h-5 w-5 text-emerald-500" />} title="Historial y Logs" description="Registros de sincronizaciones y errores." accentColor="bg-emerald-500/10" locked footer={<HistorialMockup />} />
                            </div>
                        </div>
                    </div>
                )}

                {activeModule === 'motor' && <MotorModule user={user} integraciones={integraciones} setIntegraciones={setIntegraciones} setActiveModule={setActiveModule} step={step} setStep={setStep} />}
                {activeModule === 'catalogo' && <CatalogoModule userId={user.id} setActiveModule={setActiveModule} />}
                {activeModule === 'integraciones' && <IntegracionesModule integraciones={integraciones} setActiveModule={setActiveModule} />}
            </main>
        </div>
    )
}
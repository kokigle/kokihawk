'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Loader2, MousePointer2, Download,
    ArrowLeft, LayoutGrid, LogOut, Save, CloudLightning,
    Upload, CheckCircle2, ChevronRight, Zap, RefreshCw
} from 'lucide-react'

// ─── SVG Brand Logos ────────────────────────────────────────────────────────

function MercadoLibreLogo({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="512" height="512" rx="80" fill="#FFE600" />
            <path d="M256 96C167.6 96 96 167.6 96 256s71.6 160 160 160 160-71.6 160-160S344.4 96 256 96zm0 284c-68.4 0-124-55.6-124-124s55.6-124 124-124 124 55.6 124 124-55.6 124-124 124z" fill="#2D3277" />
            <path d="M192 232h128v16H192zm0 32h128v16H192z" fill="#2D3277" />
        </svg>
    )
}

function TiendaNubeLogo({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="512" height="512" rx="80" fill="#0070F0" />
            <path d="M352 224a96 96 0 00-180.8-44.8A80 80 0 10176 336h176a64 64 0 000-112z" fill="white" />
        </svg>
    )
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
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
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all
                            ${step === s.num ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110' : ''}
                            ${step > s.num ? 'bg-primary/20 text-primary' : ''}
                            ${step < s.num ? 'bg-secondary text-muted-foreground' : ''}
                        `}>
                            {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                        </div>
                        <span className={`text-xs font-semibold hidden sm:block transition-colors ${step === s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {s.label}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <ChevronRight className={`h-4 w-4 mx-3 flex-shrink-0 ${step > i + 1 ? 'text-primary' : 'text-border'}`} />
                    )}
                </div>
            ))}
        </div>
    )
}

// ─── Column Mapping Badge ────────────────────────────────────────────────────

function MappingButton({ label, color, active, onClick }: {
    label: string, color: string, active: boolean, onClick: () => void
}) {
    const colorMap: Record<string, string> = {
        blue: active ? 'bg-blue-500 text-white border-blue-500 shadow-blue-500/30' : 'border-border text-muted-foreground hover:border-blue-400 hover:text-blue-400',
        green: active ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/30' : 'border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-400',
        orange: active ? 'bg-primary text-primary-foreground border-primary shadow-primary/30' : 'border-border text-muted-foreground hover:border-primary/60 hover:text-primary',
    }
    return (
        <button
            onClick={onClick}
            className={`
                text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border transition-all cursor-pointer
                ${colorMap[color]} ${active ? 'shadow-md' : ''}
            `}
        >
            {label}
        </button>
    )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null)
    const [step, setStep] = useState(1)
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    const [aumento, setAumento] = useState('45')
    const [redondeo, setRedondeo] = useState('0')
    const [proveedor, setProveedor] = useState('generico')

    const [previewData, setPreviewData] = useState<any[]>([])
    const [mapping, setMapping] = useState({ sku: -1, desc: -1, precio: -1, startRow: 0 })
    const [results, setResults] = useState<any[]>([])

    const [plantillas, setPlantillas] = useState<any[]>([])
    const [integraciones, setIntegraciones] = useState<any>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return; }
            setUser(user)

            const { data: templates } = await supabase.from('plantillas_mapeo').select('*').eq('user_id', user.id)
            if (templates) setPlantillas(templates)

            const params = new URLSearchParams(window.location.search)
            let needsRefetch = false;

            const tnToken = params.get('tn_token')
            const tnStore = params.get('tn_store')
            if (tnToken && tnStore) {
                await supabase.from('integraciones_api').upsert({
                    user_id: user.id,
                    tiendanube_access_token: tnToken,
                    tiendanube_store_id: tnStore,
                    updated_at: new Date().toISOString()
                })
                alert('¡Tienda Nube vinculada con éxito!')
                needsRefetch = true;
            }

            const meliToken = params.get('meli_token')
            const meliRefresh = params.get('meli_refresh')
            if (meliToken) {
                await supabase.from('integraciones_api').upsert({
                    user_id: user.id,
                    meli_access_token: meliToken,
                    meli_refresh_token: meliRefresh,
                    updated_at: new Date().toISOString()
                })
                alert('¡Mercado Libre vinculado con éxito!')
                needsRefetch = true;
            }

            if (needsRefetch) {
                window.history.replaceState(null, '', '/dashboard')
            }

            const { data: ints } = await supabase.from('integraciones_api').select('*').eq('user_id', user.id).single()
            if (ints) setIntegraciones(ints)
        }
        init()
    }, [router, supabase])

    const guardarPlantilla = async () => {
        const nombre = prompt("Nombre de la plantilla (ej: Pintarelli, SKF):")
        if (!nombre) return

        const { error } = await supabase.from('plantillas_mapeo').insert({
            user_id: user.id, nombre, col_sku: mapping.sku, col_desc: mapping.desc,
            col_precio: mapping.precio, fila_inicio: mapping.startRow
        })
        if (error) alert("Error al guardar")
        else {
            alert("¡Plantilla guardada!")
            const { data } = await supabase.from('plantillas_mapeo').select('*').eq('user_id', user.id)
            setPlantillas(data || [])
        }
    }

    const cargarPlantilla = (id: string) => {
        const t = plantillas.find(p => p.id === id)
        if (t) setMapping({ sku: t.col_sku, desc: t.col_desc, precio: t.col_precio, startRow: t.fila_inicio })
    }

    const handlePreview = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return
        setFile(selectedFile)
        setLoading(true)
        const formData = new FormData()
        formData.append('file', selectedFile)

        try {
            const res = await fetch('https://api.kokihawk.com.ar/preview-lista', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.status === 'success') { setPreviewData(data.filas); setStep(2); }
            else throw new Error(data.mensaje)
        } catch (err) { alert("Error al leer el archivo.") }
        finally { setLoading(false) }
    }

    const handleProcess = async () => {
        if (!file || mapping.sku === -1 || mapping.precio === -1) return
        setLoading(true)
        const formData = new FormData()
        formData.append('file', file); formData.append('proveedor', proveedor);
        formData.append('aumento', aumento); formData.append('redondeo', redondeo);
        formData.append('col_sku', mapping.sku.toString()); formData.append('col_desc', mapping.desc.toString());
        formData.append('col_precio', mapping.precio.toString()); formData.append('fila_inicio', mapping.startRow.toString());

        try {
            const res = await fetch('https://api.kokihawk.com.ar/procesar-lista', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.status === 'success') { setResults(data.productos); setStep(3); }
            else throw new Error(data.mensaje)
        } catch (err) { alert("Error al procesar.") }
        finally { setLoading(false) }
    }

    const handleDownload = async () => {
        setLoading(true)
        try {
            const res = await fetch('https://api.kokihawk.com.ar/descargar-excel', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(results)
            })
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = `KokiHawk_Procesado.xlsx`; a.click()
        } catch (err) { alert("Error al descargar") }
        finally { setLoading(false) }
    }

    const handleSyncTiendaNube = async () => {
        if (!integraciones?.tiendanube_access_token) {
            window.location.href = "https://www.tiendanube.com/apps/30786/authorize";
            return;
        }
        const confirmar = confirm(`¿Estás seguro de subir estos ${results.length} precios a Tienda Nube?`);
        if (!confirmar) return;
        setLoading(true)
        try {
            const payload = { access_token: integraciones.tiendanube_access_token, store_id: integraciones.tiendanube_store_id, productos: results }
            const res = await fetch('https://api.kokihawk.com.ar/sincronizar-tiendanube', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (data.status === 'success') alert(`☁️ TN COMPLETADO:\n✅ Actualizados: ${data.stats.actualizados}\n❌ No encontrados: ${data.stats.no_encontrados}\n⚠️ Errores: ${data.stats.errores}`)
            else alert("Error: " + data.mensaje)
        } catch (err) { alert("Error de red.") } finally { setLoading(false) }
    }

    const handleSyncMeLi = async () => {
        if (!integraciones?.meli_access_token) {
            const APP_ID = "3703622904525600";
            const REDIRECT_URI = "https://api.kokihawk.com.ar/meli/callback";
            window.location.href = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}`;
            return;
        }

        const confirmar = confirm(`¿Estás seguro de actualizar los precios en Mercado Libre?`);
        if (!confirmar) return;

        setLoading(true)
        try {
            const payload = {
                access_token: integraciones.meli_access_token,
                refresh_token: integraciones.meli_refresh_token,
                productos: results
            }

            const res = await fetch('https://api.kokihawk.com.ar/sincronizar-meli', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            })
            const data = await res.json()

            if (res.status === 401) {
                alert(data.mensaje)
                setIntegraciones((prev: any) => ({ ...prev, meli_access_token: null }))
            } else if (data.status === 'success') {
                if (data.nuevos_tokens) {
                    await supabase.from('integraciones_api').update({
                        meli_access_token: data.nuevos_tokens.access_token,
                        meli_refresh_token: data.nuevos_tokens.refresh_token,
                        updated_at: new Date().toISOString()
                    }).eq('user_id', user.id)

                    setIntegraciones((prev: any) => ({
                        ...prev,
                        meli_access_token: data.nuevos_tokens.access_token,
                        meli_refresh_token: data.nuevos_tokens.refresh_token
                    }))
                    console.log("Tokens de MeLi renovados automáticamente.")
                }

                alert(`📦 M.LIBRE COMPLETADO:\n\n✅ Actualizados: ${data.stats.actualizados}\n❌ No encontrados: ${data.stats.no_encontrados}\n⚠️ Errores: ${data.stats.errores}`)
            } else {
                alert("Error de la API: " + data.mensaje)
            }
        } catch (err) { alert("Error de red con MeLi.") } finally { setLoading(false) }
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-background flex flex-col">

            {/* Top Nav */}
            <nav className="bg-card border-b border-border px-6 py-0 flex justify-between items-stretch sticky top-0 z-50 h-16">
                <div className="flex items-center gap-3">
                    <div className="bg-primary rounded-lg p-1.5 shadow-md shadow-primary/20">
                        <Zap className="text-primary-foreground h-4 w-4 fill-primary-foreground" />
                    </div>
                    <div>
                        <span className="font-black text-lg tracking-tighter italic text-foreground">
                            KOKI<span className="text-primary">HAWK</span>
                        </span>
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">PRO</span>
                    </div>
                </div>

                {/* Step indicator centered */}
                <div className="hidden md:flex items-center">
                    <StepIndicator step={step} />
                </div>

                <div className="flex items-center gap-3">
                    {user && (
                        <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[160px]">
                            {user.email}
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
                        className="text-muted-foreground hover:text-foreground gap-1.5"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline text-xs">Salir</span>
                    </Button>
                </div>
            </nav>

            {/* Main content */}
            <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto space-y-6">

                {/* ── STEP 1: Upload ─────────────────────────────────────────────── */}
                {step === 1 && (
                    <div className="max-w-2xl mx-auto space-y-8 mt-8 md:mt-16">

                        {/* Header */}
                        <div className="text-center space-y-3">
                            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                Paso 1 de 3
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                                Procesamiento de Listas
                            </h1>
                            <p className="text-muted-foreground text-base">
                                Subí tu lista de precios en formato Excel o CSV y comenzá.
                            </p>
                        </div>

                        {/* Upload card */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative group border-2 border-dashed border-border rounded-2xl bg-card hover:border-primary/60 hover:bg-primary/5 transition-all duration-300 cursor-pointer overflow-hidden"
                        >
                            {/* Background glow on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <div className="relative p-16 md:p-24 flex flex-col items-center gap-6 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300 shadow-sm">
                                    <Upload className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-foreground">
                                        Arrastrá tu archivo acá o hacé clic para seleccionar
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Compatible con <span className="font-mono font-bold text-foreground">.xlsx</span>, <span className="font-mono font-bold text-foreground">.xls</span> y <span className="font-mono font-bold text-foreground">.csv</span>
                                    </p>
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handlePreview}
                                    className="hidden"
                                    accept=".xlsx,.xls,.csv"
                                />

                                <Button
                                    size="lg"
                                    disabled={loading}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 h-12 px-8 pointer-events-none"
                                >
                                    {loading ? (
                                        <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Procesando...</>
                                    ) : (
                                        <><Upload className="mr-2 h-4 w-4" /> Elegir Archivo</>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Tip cards */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { icon: '📋', label: 'Cualquier estructura', desc: 'Mapeás las columnas vos mismo' },
                                { icon: '💾', label: 'Guardás mapeos', desc: 'Plantillas para cada proveedor' },
                                { icon: '⚡', label: 'Sincronización masiva', desc: 'MeLi y TN en un clic' },
                            ].map(tip => (
                                <div key={tip.label} className="bg-card border border-border/50 rounded-xl p-4 text-center space-y-1.5">
                                    <div className="text-2xl">{tip.icon}</div>
                                    <p className="text-xs font-bold text-foreground">{tip.label}</p>
                                    <p className="text-[10px] text-muted-foreground">{tip.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Column Mapping ──────────────────────────────────────── */}
                {step === 2 && (
                    <div className="space-y-5">

                        {/* Controls bar */}
                        <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm">
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">

                                {/* Left: back + controls */}
                                <div className="space-y-4 w-full lg:w-auto">
                                    <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground -ml-2 gap-1.5">
                                        <ArrowLeft className="h-4 w-4" />
                                        Volver
                                    </Button>

                                    <div className="flex flex-wrap items-end gap-4">
                                        {/* Plantillas */}
                                        {plantillas.length > 0 && (
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase tracking-wider text-primary">Plantilla guardada</Label>
                                                <select
                                                    onChange={(e) => cargarPlantilla(e.target.value)}
                                                    className="block text-sm font-semibold border border-border bg-secondary/50 rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors text-foreground"
                                                >
                                                    <option value="">— Seleccionar —</option>
                                                    {plantillas.map(p => (
                                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Aumento */}
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Aumento %</Label>
                                            <Input
                                                type="number"
                                                value={aumento}
                                                onChange={(e) => setAumento(e.target.value)}
                                                className="h-9 w-28 font-bold text-sm bg-secondary/50"
                                            />
                                        </div>

                                        {/* Proveedor */}
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Modo de mapeo</Label>
                                            <select
                                                value={proveedor}
                                                onChange={(e) => setProveedor(e.target.value)}
                                                className="block text-sm font-semibold border border-border bg-secondary/50 rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors text-foreground"
                                            >
                                                <option value="generico">Manual (Genérico)</option>
                                                <option value="pintarelli">Pintarelli (Auto Marcas)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: actions */}
                                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                                    <Button
                                        variant="outline"
                                        onClick={guardarPlantilla}
                                        disabled={mapping.sku === -1}
                                        className="gap-2 text-sm"
                                    >
                                        <Save className="h-4 w-4" />
                                        Guardar mapeo
                                    </Button>
                                    <Button
                                        onClick={handleProcess}
                                        disabled={loading || mapping.sku === -1 || mapping.precio === -1}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 shadow-md shadow-primary/20"
                                    >
                                        {loading
                                            ? <><Loader2 className="animate-spin h-4 w-4" /> Calculando...</>
                                            : <><Zap className="h-4 w-4 fill-primary-foreground" /> Calcular Precios</>
                                        }
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Mapping hint */}
                        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                            <MousePointer2 className="h-4 w-4 text-primary flex-shrink-0" />
                            <p className="text-xs text-muted-foreground">
                                <span className="font-bold text-foreground">Instrucciones:</span> Hacé clic en los botones de colores en cada columna para asignar SKU, Descripción y Precio. Luego hacé clic en una fila para marcar donde inician los datos.
                            </p>
                        </div>

                        {/* Mapping legend */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { label: 'CÓDIGO / SKU', color: 'bg-blue-500', active: mapping.sku !== -1, desc: mapping.sku !== -1 ? `Col. ${mapping.sku + 1}` : 'Sin asignar' },
                                { label: 'DESCRIPCIÓN', color: 'bg-emerald-500', active: mapping.desc !== -1, desc: mapping.desc !== -1 ? `Col. ${mapping.desc + 1}` : 'Sin asignar' },
                                { label: 'PRECIO', color: 'bg-primary', active: mapping.precio !== -1, desc: mapping.precio !== -1 ? `Col. ${mapping.precio + 1}` : 'Sin asignar' },
                                { label: 'FILA INICIO', color: 'bg-orange-400', active: true, desc: `Fila ${mapping.startRow + 1}` },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-2 bg-card border border-border/50 rounded-lg px-3 py-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${item.color} ${!item.active && item.label !== 'FILA INICIO' ? 'opacity-30' : ''}`} />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{item.label}:</span>
                                    <span className={`text-[10px] font-bold ${item.active ? 'text-foreground' : 'text-muted-foreground/50'}`}>{item.desc}</span>
                                </div>
                            ))}
                        </div>

                        {/* Table */}
                        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-border bg-secondary/30">
                                            <th className="w-24 p-3 text-left font-bold text-[10px] uppercase tracking-wider text-muted-foreground border-r border-border/50">
                                                Fila
                                            </th>
                                            {previewData[0]?.map((_: any, idx: number) => (
                                                <th key={idx} className="p-3 border-r border-border/50 min-w-[140px]">
                                                    <div className="flex flex-col gap-1.5 items-start">
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                                            Col. {idx + 1}
                                                        </span>
                                                        <div className="flex flex-wrap gap-1">
                                                            <MappingButton label="Código" color="blue" active={mapping.sku === idx} onClick={() => setMapping({ ...mapping, sku: idx })} />
                                                            <MappingButton label="Desc." color="green" active={mapping.desc === idx} onClick={() => setMapping({ ...mapping, desc: idx })} />
                                                            <MappingButton label="Precio" color="orange" active={mapping.precio === idx} onClick={() => setMapping({ ...mapping, precio: idx })} />
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.map((fila, fIdx) => {
                                            const isStart = mapping.startRow === fIdx
                                            return (
                                                <tr
                                                    key={fIdx}
                                                    onClick={() => setMapping({ ...mapping, startRow: fIdx })}
                                                    className={`cursor-pointer border-b border-border/30 transition-colors ${isStart ? 'bg-primary/8 border-primary/30' : 'hover:bg-secondary/40'}`}
                                                >
                                                    <td className="p-3 border-r border-border/30 text-center">
                                                        {isStart ? (
                                                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">
                                                                ▶ INICIO
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-mono text-muted-foreground">{fIdx + 1}</span>
                                                        )}
                                                    </td>
                                                    {fila.map((celda: any, cIdx: number) => {
                                                        const isSku = mapping.sku === cIdx
                                                        const isDesc = mapping.desc === cIdx
                                                        const isPrecio = mapping.precio === cIdx
                                                        return (
                                                            <td
                                                                key={cIdx}
                                                                className={`p-3 text-xs border-r border-border/20 transition-colors ${isSku ? 'bg-blue-500/5 text-blue-400 font-semibold' : ''} ${isDesc ? 'bg-emerald-500/5 text-emerald-400 font-semibold' : ''} ${isPrecio ? 'bg-primary/5 text-primary font-semibold' : 'text-muted-foreground'}`}
                                                            >
                                                                {celda}
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Results & Sync ──────────────────────────────────────── */}
                {step === 3 && (
                    <div className="space-y-5">

                        {/* Summary header card */}
                        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        <h2 className="text-xl font-black text-foreground tracking-tight">
                                            Lista calculada — {results.length} productos
                                        </h2>
                                    </div>
                                    <p className="text-sm text-muted-foreground ml-7">
                                        Revisá los precios y sincronizá con tus plataformas de venta.
                                    </p>
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">

                                    {/* Download */}
                                    <Button
                                        variant="outline"
                                        onClick={handleDownload}
                                        disabled={loading}
                                        className="gap-2 font-semibold"
                                    >
                                        {loading
                                            ? <Loader2 className="animate-spin h-4 w-4" />
                                            : <Download className="h-4 w-4" />
                                        }
                                        Bajar Excel
                                    </Button>

                                    {/* New list */}
                                    <Button
                                        variant="ghost"
                                        onClick={() => { setStep(1); setFile(null); setResults([]); setMapping({ sku: -1, desc: -1, precio: -1, startRow: 0 }); }}
                                        className="gap-2 text-muted-foreground"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Nueva lista
                                    </Button>

                                    <div className="h-8 border-l border-border hidden lg:block" />

                                    {/* Mercado Libre */}
                                    <button
                                        onClick={handleSyncMeLi}
                                        disabled={loading}
                                        className={`
                                            flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all
                                            ${integraciones?.meli_access_token
                                                ? 'bg-[#FFE600] text-[#2D3277] hover:bg-[#FFD000] shadow-md shadow-[#FFE600]/20 hover:shadow-[#FFE600]/40'
                                                : 'bg-secondary text-muted-foreground border border-border hover:border-[#FFE600]/50'
                                            }
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                        `}
                                    >
                                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <MercadoLibreLogo className="h-5 w-5 rounded-sm" />}
                                        <span>
                                            {integraciones?.meli_access_token ? 'Actualizar MeLi' : 'Conectar MeLi'}
                                        </span>
                                        {!integraciones?.meli_access_token && (
                                            <span className="text-[10px] font-black text-muted-foreground/70 border border-border/50 rounded px-1.5 py-0.5">VINCULAR</span>
                                        )}
                                    </button>

                                    {/* Tienda Nube */}
                                    <button
                                        onClick={handleSyncTiendaNube}
                                        disabled={loading}
                                        className={`
                                            flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all
                                            ${integraciones?.tiendanube_access_token
                                                ? 'bg-[#0070F0] text-white hover:bg-[#005ED4] shadow-md shadow-[#0070F0]/20 hover:shadow-[#0070F0]/40'
                                                : 'bg-secondary text-muted-foreground border border-border hover:border-[#0070F0]/50'
                                            }
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                        `}
                                    >
                                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <TiendaNubeLogo className="h-5 w-5 rounded-sm" />}
                                        <span>
                                            {integraciones?.tiendanube_access_token ? 'Actualizar TN' : 'Conectar TN'}
                                        </span>
                                        {!integraciones?.tiendanube_access_token && (
                                            <span className="text-[10px] font-black text-muted-foreground/70 border border-border/50 rounded px-1.5 py-0.5">VINCULAR</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Integration status pills */}
                        <div className="flex flex-wrap gap-2">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${integraciones?.meli_access_token ? 'border-[#FFE600]/40 bg-[#FFE600]/10 text-[#FFE600]' : 'border-border bg-secondary/30 text-muted-foreground'}`}>
                                <MercadoLibreLogo className="h-3.5 w-3.5 rounded-sm" />
                                Mercado Libre: {integraciones?.meli_access_token ? '✓ Conectado' : 'Sin vincular'}
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${integraciones?.tiendanube_access_token ? 'border-[#0070F0]/40 bg-[#0070F0]/10 text-[#0070F0]' : 'border-border bg-secondary/30 text-muted-foreground'}`}>
                                <TiendaNubeLogo className="h-3.5 w-3.5 rounded-sm" />
                                Tienda Nube: {integraciones?.tiendanube_access_token ? '✓ Conectado' : 'Sin vincular'}
                            </div>
                        </div>

                        {/* Results table */}
                        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                            <div className="max-h-[520px] overflow-y-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead className="bg-secondary/40 sticky top-0 z-10 shadow-sm">
                                        <tr className="border-b border-border">
                                            <th className="text-left p-3 pl-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground w-28">Marca</th>
                                            <th className="text-left p-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">SKU</th>
                                            <th className="text-left p-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Descripción</th>
                                            <th className="text-right p-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Costo base</th>
                                            <th className="text-right p-3 pr-4 text-[10px] font-black uppercase tracking-wider text-primary">Precio final</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {results.map((prod, i) => (
                                            <tr key={i} className="hover:bg-secondary/20 transition-colors group">
                                                <td className="p-3 pl-4">
                                                    <span className="inline-block text-[9px] font-black bg-secondary border border-border/50 px-2 py-0.5 rounded-md text-muted-foreground uppercase tracking-wider group-hover:border-border transition-colors">
                                                        {prod.marca || 'Gral'}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-mono text-xs font-bold text-foreground">{prod.sku}</td>
                                                <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">{prod.descripcion}</td>
                                                <td className="p-3 text-right text-xs text-muted-foreground font-mono">
                                                    ${prod.precio_original?.toLocaleString('es-AR')}
                                                </td>
                                                <td className="p-3 pr-4 text-right">
                                                    <span className="text-sm font-black text-foreground">
                                                        ${prod.precio_final?.toLocaleString('es-AR')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Table footer */}
                            <div className="border-t border-border/50 px-4 py-3 flex items-center justify-between bg-secondary/20">
                                <span className="text-xs text-muted-foreground">
                                    {results.length} productos procesados
                                </span>
                                <div className="flex items-center gap-4">
                                    {results.length > 0 && (
                                        <>
                                            <span className="text-xs text-muted-foreground">
                                                Promedio: <span className="font-bold text-foreground">
                                                    ${Math.round(results.reduce((a, p) => a + (p.precio_final || 0), 0) / results.length).toLocaleString('es-AR')}
                                                </span>
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                Total: <span className="font-black text-primary">
                                                    ${results.reduce((a, p) => a + (p.precio_final || 0), 0).toLocaleString('es-AR')}
                                                </span>
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
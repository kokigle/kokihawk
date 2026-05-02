'use client'

import { useState, useRef, useMemo, useEffect, useDeferredValue, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
    Loader2, Download, ArrowLeft, Save, Upload, CheckCircle2,
    Zap, AlertTriangle, DatabaseZap, Filter, FileSpreadsheet,
    Info, ShieldAlert, ShieldCheck, TrendingDown, TrendingUp, Scale,
    ChevronLeft, ChevronRight, Search, X
} from 'lucide-react'
import Image from 'next/image'
import { StepIndicator, MappingButton, PlatformBadges } from './SharedUI'
import { useSyncJobs } from '@/contexts/SyncJobsContext'
import FloatingWidget from './FloatingWidget'

// ─────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 30

// ─────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────
type AnomalyKind =
    | 'bajo_costo'
    | 'alto_costo'
    | 'shock_baja_meli'
    | 'shock_alza_meli'
    | 'shock_baja_tn'
    | 'shock_alza_tn'

interface DiccionarioOption {
    id: string
    nombre_proveedor: string
    contenido: any[]
}

// ─────────────────────────────────────────────────────────────────
// ESCUDO TÉCNICO — detección de anomalías
// ─────────────────────────────────────────────────────────────────
const DROP_THRESHOLD = 0.30
const SPIKE_THRESHOLD = 4.00

function getAnomalies(prod: any): AnomalyKind[] {
    const kinds: AnomalyKind[] = []
    const nuevo = prod.precio_final ?? 0
    const costo = prod.precio_original ?? 0
    const liveMeli = prod.precio_actual_meli
    const liveTN = prod.precio_actual_tn

    if (costo > 0) {
        if (nuevo < costo) kinds.push('bajo_costo')
        if (nuevo > costo * 2) kinds.push('alto_costo')
    }
    if (liveMeli && liveMeli > 0) {
        if ((liveMeli - nuevo) / liveMeli > DROP_THRESHOLD) kinds.push('shock_baja_meli')
        if ((nuevo - liveMeli) / liveMeli > SPIKE_THRESHOLD) kinds.push('shock_alza_meli')
    }
    if (liveTN && liveTN > 0) {
        if ((liveTN - nuevo) / liveTN > DROP_THRESHOLD) kinds.push('shock_baja_tn')
        if ((nuevo - liveTN) / liveTN > SPIKE_THRESHOLD) kinds.push('shock_alza_tn')
    }
    return kinds
}

function hasAnomaly(prod: any): boolean {
    return getAnomalies(prod).length > 0
}

function formatARS(n: number) {
    return n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: Badge de shock de precio live
// ─────────────────────────────────────────────────────────────────
function PriceShockBadge({
    kind, actualPrice, newPrice,
}: { kind: 'baja' | 'alza'; actualPrice: number; newPrice: number; platform: string }) {
    const isBaja = kind === 'baja'
    const pct = isBaja
        ? Math.round((actualPrice - newPrice) / actualPrice * 100)
        : Math.round((newPrice - actualPrice) / actualPrice * 100)

    return (
        <div className={`flex items-start gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] leading-tight ${isBaja
            ? 'bg-red-500/10 border-red-500/25 text-red-500'
            : 'bg-orange-500/10 border-orange-500/25 text-orange-500'
            }`}>
            {isBaja
                ? <TrendingDown className="h-3 w-3 flex-shrink-0 mt-px" />
                : <TrendingUp className="h-3 w-3 flex-shrink-0 mt-px" />
            }
            <span className="font-black">
                {isBaja ? `−${pct}%` : `+${pct}%`}{' '}
                <span className="font-semibold opacity-80">
                    ${formatARS(actualPrice)} → ${formatARS(newPrice)}
                </span>
            </span>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: Controles de paginación
// ─────────────────────────────────────────────────────────────────
function PaginationControls({
    currentPage, totalPages, totalItems, onPrev, onNext,
}: {
    currentPage: number
    totalPages: number
    totalItems: number
    onPrev: () => void
    onNext: () => void
}) {
    if (totalPages <= 1) return null
    const from = (currentPage - 1) * PAGE_SIZE + 1
    const to = Math.min(currentPage * PAGE_SIZE, totalItems)

    return (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/40 bg-secondary/20">
            <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                {from}–{to} de {totalItems.toLocaleString('es-AR')} productos
            </span>
            <div className="flex items-center gap-1.5">
                <button
                    onClick={onPrev}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/60 text-[10px] font-bold text-muted-foreground hover:bg-secondary/60 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft className="h-3 w-3" /> Anterior
                </button>
                <span className="text-[10px] font-black text-foreground bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-lg tabular-nums">
                    {currentPage} / {totalPages}
                </span>
                <button
                    onClick={onNext}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/60 text-[10px] font-bold text-muted-foreground hover:bg-secondary/60 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    Siguiente <ChevronRight className="h-3 w-3" />
                </button>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: Checkbox de responsabilidad legal
// ─────────────────────────────────────────────────────────────────
function LegalCheckbox({
    checked, onChange,
}: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className={`flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 ${checked
            ? 'bg-emerald-500/5 border-emerald-500/25'
            : 'bg-secondary/30 border-border/60'
            }`}>
            <div className="flex-shrink-0 mt-0.5">
                <button
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => onChange(!checked)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/30 ${checked
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-border/60 hover:border-primary/50 bg-secondary/40'
                        }`}
                >
                    {checked && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    {checked
                        ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        : <Scale className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    }
                    <span className={`text-[10px] font-black uppercase tracking-widest ${checked ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        Confirmación requerida
                    </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Confirmo que he revisado los precios finales. Entiendo que KokiHawk es una herramienta de cálculo
                    y asumo total responsabilidad sobre los precios publicados, aceptando los{' '}
                    <Link
                        href="/terminos"
                        target="_blank"
                        className="text-primary hover:text-primary/80 underline underline-offset-2 font-semibold transition-colors"
                    >
                        Términos y Condiciones
                    </Link>
                    {' '}del servicio.
                </p>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────
interface Props {
    user: any
    integraciones: any
    setIntegraciones: any
    setActiveModule: (m: string) => void
    step: number
    setStep: (s: number) => void
}

// ─────────────────────────────────────────────────────────────────
// MOTOR MODULE
// ─────────────────────────────────────────────────────────────────
export default function MotorModule({ user, integraciones, setIntegraciones, setActiveModule, step, setStep }: Props) {
    const { addJob } = useSyncJobs()
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [aumento, setAumento] = useState('45')
    const [redondeo, setRedondeo] = useState('0')
    const [previewData, setPreviewData] = useState<any[]>([])
    const [mapping, setMapping] = useState({ sku: -1, desc: -1, precio: -1, startRow: 0 })
    const [results, setResults] = useState<any[]>([])
    const [filterMeli, setFilterMeli] = useState(false)
    const [filterTN, setFilterTN] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [plantillas, setPlantillas] = useState<any[]>([])
    const [diccionarios, setDiccionarios] = useState<DiccionarioOption[]>([])
    const [diccionarioSelId, setDiccionarioSelId] = useState<string>('')
    const [legalConfirmed, setLegalConfirmed] = useState(false)

    // ── Paginación del Paso 3 ──
    const [currentPage, setCurrentPage] = useState(1)

    const deferredFilterMeli = useDeferredValue(filterMeli)
    const deferredFilterTN = useDeferredValue(filterTN)
    const deferredSearchQuery = useDeferredValue(searchQuery)
    const [, startTransition] = useTransition()

    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    // Reset checkbox legal cuando llegan resultados nuevos
    useEffect(() => { setLegalConfirmed(false) }, [results])

    // Reset página cuando cambia el conjunto filtrado o la búsqueda
    useEffect(() => { setCurrentPage(1) }, [results, deferredFilterMeli, deferredFilterTN, deferredSearchQuery])

    useEffect(() => {
        if (user) {
            supabase.from('plantillas_mapeo').select('*').eq('user_id', user.id).then(({ data }) => {
                if (data) setPlantillas(data)
            })
            // Cargar diccionarios del usuario
            supabase
                .from('diccionarios')
                .select('id, nombre_proveedor, contenido')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .then(({ data }) => { if (data) setDiccionarios(data) })
        }
    }, [user]) // eslint-disable-line

    const guardarPlantilla = async () => {
        const nombre = prompt('Nombre de la plantilla:')
        if (!nombre) return
        const { error } = await supabase.from('plantillas_mapeo').insert({
            user_id: user.id, nombre,
            col_sku: mapping.sku, col_desc: mapping.desc,
            col_precio: mapping.precio, fila_inicio: mapping.startRow,
        })
        if (error) alert('Error al guardar')
        else {
            alert('¡Plantilla guardada!')
            const { data } = await supabase.from('plantillas_mapeo').select('*').eq('user_id', user.id)
            setPlantillas(data || [])
        }
    }

    const cargarPlantilla = useCallback((id: string) => {
        const t = plantillas.find(p => p.id === id)
        if (t) setMapping({ sku: t.col_sku, desc: t.col_desc, precio: t.col_precio, startRow: t.fila_inicio })
    }, [plantillas])

    const handlePreview = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return
        setFile(selectedFile); setLoading(true)
        const formData = new FormData(); formData.append('file', selectedFile)
        try {
            const res = await fetch('https://api.kokihawk.com.ar/preview-lista', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.status === 'success') { setPreviewData(data.filas); setStep(2) }
            else throw new Error(data.mensaje)
        } catch { alert('Error al leer el archivo.') } finally { setLoading(false) }
    }

    const handleProcess = async () => {
        if (!file || mapping.sku === -1 || mapping.precio === -1) return
        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('proveedor', 'generico')
        formData.append('aumento', aumento)
        formData.append('redondeo', redondeo)
        formData.append('col_sku', mapping.sku.toString())
        formData.append('col_desc', mapping.desc.toString())
        formData.append('col_precio', mapping.precio.toString())
        formData.append('fila_inicio', mapping.startRow.toString())

        if (integraciones?.meli_access_token) {
            formData.append('meli_token', integraciones.meli_access_token)
            formData.append('meli_refresh', integraciones.meli_refresh_token)
        }
        if (integraciones?.tiendanube_access_token) formData.append('tn_token', integraciones.tiendanube_access_token)
        if (integraciones?.tiendanube_store_id) formData.append('tn_store', integraciones.tiendanube_store_id)

        // ── Diccionario seleccionado ──────────────────────
        if (diccionarioSelId) {
            const dic = diccionarios.find(d => d.id === diccionarioSelId)
            if (dic?.contenido) {
                formData.append('diccionario', JSON.stringify(dic.contenido))
            }
        }

        try {
            const res = await fetch('https://api.kokihawk.com.ar/procesar-lista', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.status === 'success') {
                if (data.nuevos_tokens_meli) {
                    await supabase.from('integraciones_api').update({
                        meli_access_token: data.nuevos_tokens_meli.access_token,
                        meli_refresh_token: data.nuevos_tokens_meli.refresh_token,
                        updated_at: new Date().toISOString(),
                    }).eq('user_id', user.id)
                    setIntegraciones((prev: any) => ({
                        ...prev,
                        meli_access_token: data.nuevos_tokens_meli.access_token,
                        meli_refresh_token: data.nuevos_tokens_meli.refresh_token,
                    }))
                }
                setResults(data.productos)
                setStep(3)
            } else throw new Error(data.mensaje)
        } catch { alert('Error al procesar.') } finally { setLoading(false) }
    }

    const handleSaveCatalogo = async () => {
        if (!results.length) return
        setLoading(true)
        try {
            const uniqueDataMap = new Map()
            results.forEach(p => {
                const cleanSku = p.sku.toString().trim().toUpperCase()
                uniqueDataMap.set(cleanSku, {
                    user_id: user.id, sku: cleanSku,
                    descripcion: p.descripcion, precio_final: p.precio_final, plataformas: p.plataformas || [],
                })
            })
            const dataToSave = Array.from(uniqueDataMap.values())
            for (let i = 0; i < dataToSave.length; i += 1000) {
                const { error } = await supabase.from('catalogo_precios').upsert(
                    dataToSave.slice(i, i + 1000),
                    { onConflict: 'user_id, sku' }
                )
                if (error) throw error
            }
            alert(`¡Catálogo actualizado! Se guardaron ${dataToSave.length} productos únicos.`)
        } catch (err: any) { alert('Error al guardar en el catálogo: ' + err.message) }
        finally { setLoading(false) }
    }

    const handleDownload = async () => {
        setLoading(true)
        try {
            const res = await fetch('https://api.kokihawk.com.ar/descargar-excel', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(results),
            })
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = 'KokiHawk_Procesado.xlsx'; a.click()
        } catch { alert('Error al descargar') } finally { setLoading(false) }
    }

    // ── Sync TiendaNube (Job Queue) ───────────────────────────────────────────────
    const handleSyncTiendaNube = async () => {
        if (!integraciones?.tiendanube_access_token) {
            window.location.href = 'https://www.tiendanube.com/apps/30786/authorize'; return
        }
        if (!confirm(`¿Actualizar ${results.length} precios en Tienda Nube?`)) return

        const fileName = file?.name || 'manual'
        try {
            const res = await fetch('https://api.kokihawk.com.ar/sincronizar-tiendanube', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_token: integraciones.tiendanube_access_token,
                    store_id: integraciones.tiendanube_store_id,
                    productos: results,
                    user_id: user.id,
                    file_name: fileName,
                }),
            })
            const data = await res.json()
            if (data.job_id) {
                addJob({ job_id: data.job_id, plataforma: 'tn', file_name: fileName })
            } else {
                alert('Error al encolar: ' + (data.mensaje ?? 'desconocido'))
            }
        } catch (err) {
            alert('Error de red al sincronizar TN')
        }
    }

    // ── Sync MeLi (Job Queue) ─────────────────────────────────────────────────────
    const handleSyncMeLi = async () => {
        if (!integraciones?.meli_access_token) {
            window.location.href = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=3703622904525600&redirect_uri=https://api.kokihawk.com.ar/meli/callback`; return
        }
        if (!confirm(`¿Actualizar ${results.length} precios en Mercado Libre?`)) return

        const fileName = file?.name || 'manual'
        try {
            const res = await fetch('https://api.kokihawk.com.ar/sincronizar-meli', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_token: integraciones.meli_access_token,
                    refresh_token: integraciones.meli_refresh_token,
                    productos: results,
                    user_id: user.id,
                    file_name: fileName,
                }),
            })
            const data = await res.json()
            if (data.job_id) {
                addJob({ job_id: data.job_id, plataforma: 'meli', file_name: fileName })
            } else {
                alert('Error al encolar: ' + (data.mensaje ?? 'desconocido'))
            }
        } catch (err) {
            alert('Error de red al sincronizar MeLi')
        }
    }

    const updatePrecioFinal = useCallback((sku: string, newValue: number) => {
        setResults(prev => prev.map(p => p.sku === sku ? { ...p, precio_final: newValue } : p))
    }, [])

    // ── Lista filtrada, buscada y ordenada (todos los items, no paginada aún) ──
    const processedResults = useMemo(() => {
        let filtered = [...results]
        if (deferredFilterMeli && !deferredFilterTN) filtered = filtered.filter(p => p.plataformas?.includes('meli'))
        else if (deferredFilterTN && !deferredFilterMeli) filtered = filtered.filter(p => p.plataformas?.includes('tn'))
        else if (deferredFilterMeli && deferredFilterTN) filtered = filtered.filter(p => p.plataformas?.includes('meli') || p.plataformas?.includes('tn'))

        if (deferredSearchQuery.trim()) {
            const q = deferredSearchQuery.trim().toLowerCase()
            filtered = filtered.filter(p =>
                String(p.sku ?? '').toLowerCase().includes(q) ||
                String(p.descripcion ?? '').toLowerCase().includes(q)
            )
        }
        return filtered.sort((a, b) => {
            const aH = hasAnomaly(a), bH = hasAnomaly(b)
            return aH === bH ? 0 : aH ? -1 : 1
        })
    }, [results, deferredFilterMeli, deferredFilterTN, deferredSearchQuery])

    // ── Slice paginado para el DOM ──
    const totalPages = Math.max(1, Math.ceil(processedResults.length / PAGE_SIZE))
    const paginatedResults = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return processedResults.slice(start, start + PAGE_SIZE)
    }, [processedResults, currentPage])

    const anomalyCount = useMemo(() => results.filter(hasAnomaly).length, [results])
    const isFilterPending = filterMeli !== deferredFilterMeli || filterTN !== deferredFilterTN || searchQuery !== deferredSearchQuery
    const canProcess = mapping.sku !== -1 && mapping.precio !== -1
    const canSync = legalConfirmed && !loading

    return (
        <div className="space-y-5 mt-4">

            {/* Back + step */}
            <div className="flex items-center justify-between gap-4">
                <Button variant="ghost" size="sm" onClick={() => setActiveModule('hub')}
                    className="text-muted-foreground hover:text-foreground gap-1.5 -ml-2 h-8">
                    <ArrowLeft className="h-3.5 w-3.5" /> Volver
                </Button>
                <div className="hidden md:flex"><StepIndicator step={step} /></div>
            </div>

            {/* ── STEP 1 ── */}
            {step === 1 && (
                <div className="max-w-xl mx-auto space-y-8 mt-4 md:mt-8">
                    <div className="text-center space-y-2">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                            <FileSpreadsheet className="h-7 w-7 text-primary" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Motor de Listas</h1>
                        <p className="text-muted-foreground text-base">Subí tu lista de precios en Excel o CSV para comenzar.</p>
                    </div>
                    <div onClick={() => fileInputRef.current?.click()}
                        className="group relative border-2 border-dashed border-border/60 rounded-2xl bg-card hover:border-primary/50 hover:bg-primary/3 transition-all duration-200 cursor-pointer overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 24px, currentColor 24px, currentColor 25px), repeating-linear-gradient(90deg, transparent, transparent 24px, currentColor 24px, currentColor 25px)` }} />
                        <div className="relative p-12 md:p-16 flex flex-col items-center gap-5 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center group-hover:bg-primary/12 group-hover:scale-105 transition-all duration-200">
                                <Upload className="h-7 w-7 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-foreground">Arrastrá tu archivo o hacé clic para elegir</p>
                                <p className="text-xs text-muted-foreground">Formatos: <span className="font-mono font-bold">.xlsx</span> · <span className="font-mono font-bold">.xls</span> · <span className="font-mono font-bold">.csv</span></p>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handlePreview} className="hidden" accept=".xlsx,.xls,.csv" />
                            <Button size="lg" disabled={loading}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 h-11 px-8 pointer-events-none">
                                {loading ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Leyendo...</> : 'Elegir Archivo'}
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-start gap-2.5 bg-secondary/30 border border-border/50 rounded-xl p-4">
                        <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            En el paso siguiente indicás cuál columna es el SKU, descripción y precio de costo. Podés guardar ese mapeo como plantilla para no repetirlo.
                        </p>
                    </div>
                </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div className="flex flex-wrap items-end gap-3">
                                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-muted-foreground h-8 -ml-1">
                                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Cambiar archivo
                                </Button>
                                {plantillas.length > 0 && (
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-primary">Plantilla guardada</Label>
                                        <select onChange={(e) => cargarPlantilla(e.target.value)}
                                            className="h-9 text-sm font-semibold border border-border/60 rounded-lg px-3 outline-none bg-secondary/40 text-foreground focus:border-primary/50">
                                            <option value="">Seleccionar...</option>
                                            {plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Dropdown diccionario — Step 2 */}
                                {diccionarios.length > 0 && (
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-violet-400">Diccionario SKUs</Label>
                                        <select
                                            value={diccionarioSelId}
                                            onChange={e => setDiccionarioSelId(e.target.value)}
                                            className="h-9 text-sm font-semibold border border-border/60 rounded-lg px-3 outline-none bg-secondary/40 text-foreground focus:border-violet-500/50"
                                        >
                                            <option value="">Sin diccionario</option>
                                            {diccionarios.map(d => (
                                                <option key={d.id} value={d.id}>{d.nombre_proveedor}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Aumento %</Label>
                                    <Input type="number" value={aumento} onChange={(e) => setAumento(e.target.value)}
                                        className="h-9 w-24 font-bold text-sm bg-secondary/40 border-border/60 focus:border-primary/50" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Redondeo</Label>
                                    <select value={redondeo} onChange={(e) => setRedondeo(e.target.value)}
                                        className="h-9 text-sm font-semibold border border-border/60 rounded-lg px-3 outline-none bg-secondary/40 text-foreground focus:border-primary/50">
                                        <option value="0">Sin redondeo</option>
                                        <option value="10">A la decena ($10)</option>
                                        <option value="50">A los $50</option>
                                        <option value="100">A la centena ($100)</option>
                                        <option value="1000">Al millar ($1000)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <Button variant="outline" onClick={guardarPlantilla} disabled={!canProcess} size="sm"
                                    className="border-border/60 text-xs font-bold gap-1.5">
                                    <Save className="h-3.5 w-3.5" /> Guardar mapeo
                                </Button>
                                <Button onClick={handleProcess} disabled={loading || !canProcess}
                                    className="bg-primary hover:bg-primary/90 font-bold shadow-md shadow-primary/20 gap-1.5 text-sm">
                                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Zap className="h-4 w-4" />}
                                    Calcular Precios
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mr-1">Asignar columnas:</span>
                        {[
                            { label: 'CÓDIGO', color: 'bg-blue-500', active: mapping.sku !== -1 },
                            { label: 'DESC.', color: 'bg-emerald-500', active: mapping.desc !== -1 },
                            { label: 'PRECIO', color: 'bg-primary', active: mapping.precio !== -1 },
                        ].map(item => (
                            <div key={item.label} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-colors ${item.active ? 'bg-card border-border/70' : 'bg-muted/30 border-border/40'}`}>
                                <div className={`w-2 h-2 rounded-full ${item.color} ${!item.active ? 'opacity-30' : ''}`} />
                                <span className={item.active ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                                {item.active && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                            </div>
                        ))}
                        {!canProcess && <p className="text-[10px] text-muted-foreground/60 ml-1">← Hacé clic en los botones de cada columna</p>}
                    </div>
                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse min-w-[400px]">
                                <thead>
                                    <tr className="border-b border-border/60 bg-secondary/40">
                                        <th className="w-20 p-3 text-left font-bold text-[10px] text-muted-foreground border-r border-border/30">Fila</th>
                                        {previewData[0]?.map((_: any, idx: number) => (
                                            <th key={idx} className="p-3 border-r border-border/30 min-w-[130px]">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[9px] font-bold text-muted-foreground/50">Col. {idx + 1}</span>
                                                    <div className="flex gap-1">
                                                        <MappingButton label="Cód" color="blue" active={mapping.sku === idx} onClick={() => setMapping(m => ({ ...m, sku: idx }))} />
                                                        <MappingButton label="Desc" color="green" active={mapping.desc === idx} onClick={() => setMapping(m => ({ ...m, desc: idx }))} />
                                                        <MappingButton label="Precio" color="orange" active={mapping.precio === idx} onClick={() => setMapping(m => ({ ...m, precio: idx }))} />
                                                    </div>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((fila, fIdx) => (
                                        <tr key={fIdx} onClick={() => setMapping(m => ({ ...m, startRow: fIdx }))}
                                            className={`cursor-pointer border-b border-border/20 transition-colors ${mapping.startRow === fIdx ? 'bg-primary/8' : 'hover:bg-secondary/20'}`}>
                                            <td className="p-3 border-r border-border/20 text-center">
                                                {mapping.startRow === fIdx
                                                    ? <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">▶ INICIO</span>
                                                    : <span className="text-[10px] text-muted-foreground/40">{fIdx + 1}</span>
                                                }
                                            </td>
                                            {fila.map((c: any, cIdx: number) => (
                                                <td key={cIdx} className={`p-3 text-xs border-r border-border/15 font-medium truncate max-w-[180px] ${mapping.sku === cIdx ? 'text-blue-400' : mapping.desc === cIdx ? 'text-emerald-400' : mapping.precio === cIdx ? 'text-primary' : 'text-muted-foreground/60'}`}>
                                                    {c}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-4 py-2 bg-secondary/20 border-t border-border/40 flex items-center gap-2">
                            <Info className="h-3 w-3 text-muted-foreground/40" />
                            <p className="text-[10px] text-muted-foreground/50">Hacé clic en una fila para marcarla como fila de inicio de datos.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
                <div className="space-y-4">

                    {/* Banner de anomalías críticas */}
                    {anomalyCount > 0 && (
                        <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/25 rounded-2xl p-4">
                            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                                <ShieldAlert className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-red-500">
                                    {anomalyCount} precio{anomalyCount !== 1 ? 's requieren' : ' requiere'} revisión
                                </p>
                                <p className="text-xs text-red-400/80 mt-0.5 leading-relaxed">
                                    Detectamos precios que se alejan significativamente de su valor publicado actual o de su costo de proveedor. Revisá cada uno antes de sincronizar.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Results header */}
                    <div className="bg-card border border-border/60 rounded-2xl p-4 md:p-5 shadow-sm">
                        <div className="flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">
                            <div>
                                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                    {results.length.toLocaleString('es-AR')} productos calculados
                                </h2>
                                {anomalyCount > 0 && (
                                    <p className="text-xs font-bold text-red-500 flex items-center gap-1.5 pl-7 mt-0.5">
                                        <AlertTriangle className="h-3 w-3" />
                                        {anomalyCount} anomalías — revisá los precios marcados antes de sincronizar
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                                <Button variant="outline" onClick={handleDownload} disabled={loading} size="sm"
                                    className="border-border/60 text-xs font-bold gap-1.5">
                                    <Download className="h-3.5 w-3.5" /> Excel
                                </Button>
                                <Button onClick={handleSaveCatalogo} disabled={loading || !results.length} variant="outline" size="sm"
                                    className="border-violet-500/30 text-violet-400 hover:bg-violet-500/8 text-xs font-bold gap-1.5">
                                    <DatabaseZap className="h-3.5 w-3.5" /> Guardar Catálogo
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* ── ESCUDO LEGAL + Botones de sync — arriba de la tabla ── */}
                    <div className="space-y-3">
                        <LegalCheckbox checked={legalConfirmed} onChange={setLegalConfirmed} />

                        <div className={`flex flex-wrap gap-3 items-center p-4 rounded-2xl border transition-all duration-200 ${legalConfirmed ? 'bg-card border-border/60' : 'bg-muted/20 border-border/40'}`}>
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground flex-shrink-0">
                                {legalConfirmed
                                    ? <><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Listo para sincronizar</>
                                    : <><ShieldAlert className="h-3.5 w-3.5 text-muted-foreground/50" /> Confirmá antes de sincronizar</>
                                }
                            </div>
                            <div className="flex gap-2 ml-auto flex-wrap">
                                <button
                                    onClick={canSync && integraciones?.meli_access_token ? handleSyncMeLi : undefined}
                                    disabled={!canSync || !integraciones?.meli_access_token}
                                    title={
                                        !legalConfirmed
                                            ? 'Confirmá los términos primero'
                                            : !integraciones?.meli_access_token
                                                ? 'Conectá Mercado Libre en Integraciones'
                                                : ''
                                    }
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${canSync && integraciones?.meli_access_token
                                        ? 'bg-[#FFE600] text-[#2D3277] hover:opacity-90 shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02]'
                                        : 'bg-secondary/50 text-muted-foreground/40 cursor-not-allowed border border-border/40'
                                        }`}
                                >
                                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Image src="/logos/meli.png" width={16} height={16} alt="meli" className="rounded-sm" />}
                                    {integraciones?.meli_access_token ? 'Actualizar MeLi' : 'MeLi sin conectar'}
                                </button>
                                <button
                                    onClick={canSync && integraciones?.tiendanube_access_token ? handleSyncTiendaNube : undefined}
                                    disabled={!canSync || !integraciones?.tiendanube_access_token}
                                    title={
                                        !legalConfirmed
                                            ? 'Confirmá los términos primero'
                                            : !integraciones?.tiendanube_access_token
                                                ? 'Conectá Tienda Nube en Integraciones'
                                                : ''
                                    }
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${canSync && integraciones?.tiendanube_access_token
                                        ? 'bg-[#0070F0] text-white hover:opacity-90 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02]'
                                        : 'bg-secondary/50 text-muted-foreground/40 cursor-not-allowed border border-border/40'
                                        }`}
                                >
                                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Image src="/logos/tiendanube.png" width={16} height={16} alt="tn" className="rounded-sm" />}
                                    {integraciones?.tiendanube_access_token ? 'Actualizar TN' : 'TN sin conectar'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filter bar + búsqueda */}
                    <div className="flex flex-wrap items-center gap-2 bg-card border border-border/60 rounded-2xl px-4 py-3 shadow-sm">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 flex-shrink-0">
                            <Filter className="h-3 w-3" /> Filtrar:
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <Switch checked={filterMeli} onCheckedChange={(v) => startTransition(() => setFilterMeli(v))} className="scale-75" />
                            <span className={`text-xs font-bold ${filterMeli ? 'text-amber-400' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}>Mercado Libre</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <Switch checked={filterTN} onCheckedChange={(v) => startTransition(() => setFilterTN(v))} className="scale-75" />
                            <span className={`text-xs font-bold ${filterTN ? 'text-blue-400' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}>Tienda Nube</span>
                        </label>

                        {/* Barra de búsqueda */}
                        <div className="relative ml-auto flex-1 min-w-[180px] max-w-xs">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => startTransition(() => setSearchQuery(e.target.value))}
                                placeholder="Buscar SKU o descripción..."
                                className="h-8 pl-8 pr-8 text-xs font-medium bg-secondary/40 border-border/60 focus:border-primary/50 focus:bg-secondary/60 placeholder:text-muted-foreground/40"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        <span className={`text-xs font-bold tabular-nums flex-shrink-0 transition-opacity ${isFilterPending ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
                            {processedResults.length} / {results.length}
                        </span>
                    </div>

                    {/* Results table */}
                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                        <div className={`overflow-x-auto transition-opacity ${isFilterPending ? 'opacity-60' : 'opacity-100'}`}>
                            <table className="w-full text-sm border-collapse min-w-[680px]">
                                <thead className="bg-secondary/50 sticky top-0 border-b border-border/60 z-10">
                                    <tr>
                                        <th className="w-8 p-3" />
                                        <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Plat.</th>
                                        <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">SKU</th>
                                        <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Descripción</th>
                                        <th className="text-right p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Costo</th>
                                        <th className="text-right p-3 text-[9px] font-black uppercase tracking-widest text-blue-400">Precio Actual ↗</th>
                                        <th className="text-right p-3 pr-4 text-[9px] font-black uppercase tracking-widest text-primary">Precio Nuevo ✏️</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {paginatedResults.map((prod, i) => {
                                        const kinds = getAnomalies(prod)
                                        const hasProblems = kinds.length > 0
                                        const liveMeli = prod.precio_actual_meli
                                        const liveTN = prod.precio_actual_tn
                                        const liveRef = liveMeli ?? liveTN
                                        const hasBajaMeli = kinds.includes('shock_baja_meli')
                                        const hasBajaTN = kinds.includes('shock_baja_tn')
                                        const hasAlzaMeli = kinds.includes('shock_alza_meli')
                                        const hasAlzaTN = kinds.includes('shock_alza_tn')

                                        return (
                                            <tr key={`${prod.sku}-${i}`} className={`transition-colors ${hasProblems ? 'bg-red-500/4 hover:bg-red-500/6' : 'hover:bg-secondary/15'}`}>
                                                {/* Alert icon */}
                                                <td className="p-3 text-center">
                                                    {hasProblems && <AlertTriangle className="h-3.5 w-3.5 text-red-500 mx-auto" />}
                                                </td>

                                                {/* Platform */}
                                                <td className="p-3"><PlatformBadges plataformas={prod.plataformas} /></td>

                                                {/* SKU */}
                                                <td className="p-3"><span className="font-mono font-bold text-xs">{prod.sku}</span></td>

                                                {/* Descripción + price shock warnings */}
                                                <td className="p-3">
                                                    <span className="text-xs text-muted-foreground/80 max-w-[180px] truncate block">{prod.descripcion}</span>
                                                    {(hasBajaMeli || hasAlzaMeli) && liveMeli && (
                                                        <div className="mt-1.5 flex items-center gap-1">
                                                            <div className="w-3 h-3 rounded-sm overflow-hidden bg-white flex-shrink-0">
                                                                <Image src="/logos/meli.png" alt="ML" width={10} height={10} className="object-contain" />
                                                            </div>
                                                            <PriceShockBadge kind={hasBajaMeli ? 'baja' : 'alza'} actualPrice={liveMeli} newPrice={prod.precio_final ?? 0} platform="meli" />
                                                        </div>
                                                    )}
                                                    {(hasBajaTN || hasAlzaTN) && liveTN && (
                                                        <div className="mt-1 flex items-center gap-1">
                                                            <div className="w-3 h-3 rounded-sm overflow-hidden bg-white flex-shrink-0">
                                                                <Image src="/logos/tiendanube.png" alt="TN" width={10} height={10} className="object-contain" />
                                                            </div>
                                                            <PriceShockBadge kind={hasBajaTN ? 'baja' : 'alza'} actualPrice={liveTN} newPrice={prod.precio_final ?? 0} platform="tn" />
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Costo proveedor */}
                                                <td className="p-3 text-right align-top">
                                                    <span className="text-xs font-mono text-muted-foreground">${formatARS(prod.precio_original ?? 0)}</span>
                                                </td>

                                                {/* Precio actual publicado */}
                                                <td className="p-3 text-right align-top">
                                                    {liveRef != null ? (
                                                        <span className="text-xs font-mono font-semibold text-blue-400">${formatARS(liveRef)}</span>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground/30 italic">—</span>
                                                    )}
                                                </td>

                                                {/* Precio nuevo editable */}
                                                <td className="p-3 pr-4 text-right align-top">
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        {kinds.includes('bajo_costo') && (
                                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded border text-red-500 bg-red-500/10 border-red-500/20">↓ BAJO COSTO</span>
                                                        )}
                                                        {kinds.includes('alto_costo') && (
                                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded border text-orange-500 bg-orange-500/10 border-orange-500/20">↑ ALTO COSTO</span>
                                                        )}
                                                        <input
                                                            type="number"
                                                            value={prod.precio_final ?? ''}
                                                            onChange={(e) => updatePrecioFinal(prod.sku, parseFloat(e.target.value))}
                                                            className={`w-[110px] text-right font-black rounded-lg border bg-transparent py-1.5 px-2.5 text-sm outline-none transition-all focus:ring-1 ${hasProblems
                                                                ? 'border-red-500/50 text-red-400 focus:ring-red-500/20 focus:border-red-500/70 shadow-sm shadow-red-500/10'
                                                                : 'border-border/50 focus:ring-primary/20 focus:border-primary/40'
                                                                }`}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Controles de paginación ── */}
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={processedResults.length}
                            onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
                            onNext={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        />
                    </div>

                </div>
            )}

            {/* Widget flotante de progreso — vive fuera del flujo del step */}
            <FloatingWidget
                onTokensRefreshed={(plataforma, tokens) => {
                    if (plataforma === 'meli') {
                        supabase.from('integraciones_api').update({
                            meli_access_token: tokens.access_token,
                            meli_refresh_token: tokens.refresh_token,
                            updated_at: new Date().toISOString(),
                        }).eq('user_id', user.id)
                        setIntegraciones((prev: any) => ({
                            ...prev,
                            meli_access_token: tokens.access_token,
                            meli_refresh_token: tokens.refresh_token,
                        }))
                    }
                }}
            />
        </div>
    )
}
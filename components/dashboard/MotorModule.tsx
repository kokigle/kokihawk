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
    ChevronLeft, ChevronRight, Search, X, Undo2
} from 'lucide-react'
import Image from 'next/image'
import { StepIndicator, MappingButton, PlatformBadges } from './SharedUI'
import { useSyncJobs } from '@/contexts/SyncJobsContext'
import FloatingWidget from './FloatingWidget'
import { toast } from 'sonner'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { AnimatePresence, motion } from 'framer-motion'

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
    const pMeli = prod.precio_meli ?? nuevo
    const pTN = prod.precio_tn ?? nuevo

    if (costo > 0) {
        if (nuevo < costo) kinds.push('bajo_costo')
        if (nuevo > costo * 2) kinds.push('alto_costo')
    }
    if (liveMeli && liveMeli > 0) {
        if ((liveMeli - pMeli) / liveMeli > DROP_THRESHOLD) kinds.push('shock_baja_meli')
        if ((pMeli - liveMeli) / liveMeli > SPIKE_THRESHOLD) kinds.push('shock_alza_meli')
    }
    if (liveTN && liveTN > 0) {
        if ((liveTN - pTN) / liveTN > DROP_THRESHOLD) kinds.push('shock_baja_tn')
        if ((pTN - liveTN) / liveTN > SPIKE_THRESHOLD) kinds.push('shock_alza_tn')
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
    const [sessionId, setSessionId] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [aumento, setAumento] = useState('45')
    const [ajusteMeli, setAjusteMeli] = useState('0')
    const [ajusteTN, setAjusteTN] = useState('0')
    const [redondeo, setRedondeo] = useState('0')
    const [catalogMaps, setCatalogMaps] = useState<any>(null)
    const [proveedores, setProveedores] = useState<{id: string, nombre: string}[]>([])
    const [proveedorSel, setProveedorSel] = useState('')
    const [newProvName, setNewProvName] = useState('')
    const [showNewProv, setShowNewProv] = useState(false)
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
    const [confirmModal, setConfirmModal] = useState<{ title: string; desc: string; action: () => void } | null>(null)
    const [plantillaName, setPlantillaName] = useState('')
    const [showPlantillaInput, setShowPlantillaInput] = useState(false)
    const [excelSheets, setExcelSheets] = useState<string[]>([])
    const [selectedSheet, setSelectedSheet] = useState<string>('')
    const [providerMemory, setProviderMemory] = useState<any>(null)
    const [smartMapping, setSmartMapping] = useState<any>(null)
    const [autoDetectSource, setAutoDetectSource] = useState<'memory' | 'smart' | null>(null)

    // ── Paginación del Paso 3 ──
    const [currentPage, setCurrentPage] = useState(1)

    const deferredFilterMeli = useDeferredValue(filterMeli)
    const deferredFilterTN = useDeferredValue(filterTN)
    const deferredSearchQuery = useDeferredValue(searchQuery)
    const [, startTransition] = useTransition()

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const supabase = useMemo(() => createClient(), [])

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
            // Cargar proveedores del usuario
            supabase
                .from('proveedores')
                .select('id, nombre')
                .eq('user_id', user.id)
                .order('nombre')
                .then(({ data }) => { if (data) setProveedores(data) })
        }
    }, [user]) // eslint-disable-line

    const crearProveedor = async () => {
        const name = newProvName.trim()
        if (!name) return
        const { data, error } = await supabase.from('proveedores').insert({ user_id: user.id, nombre: name }).select('id, nombre').single()
        if (error) { toast.error('Error al crear proveedor: ' + error.message); return }
        setProveedores(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
        setProveedorSel(data.nombre)
        setNewProvName('')
        setShowNewProv(false)
        toast.success(`Proveedor "${data.nombre}" creado`)
    }

    const guardarPlantilla = async () => {
        if (!plantillaName.trim()) { setShowPlantillaInput(true); return }
        const { error } = await supabase.from('plantillas_mapeo').insert({
            user_id: user.id, nombre: plantillaName.trim(),
            col_sku: mapping.sku, col_desc: mapping.desc,
            col_precio: mapping.precio, fila_inicio: mapping.startRow,
        })
        if (error) toast.error('Error al guardar la plantilla')
        else {
            toast.success('¡Plantilla guardada!')
            setPlantillaName(''); setShowPlantillaInput(false)
            const { data } = await supabase.from('plantillas_mapeo').select('*').eq('user_id', user.id)
            setPlantillas(data || [])
        }
    }

    const cargarPlantilla = useCallback((id: string) => {
        const t = plantillas.find(p => p.id === id)
        if (t) setMapping({ sku: t.col_sku, desc: t.col_desc, precio: t.col_precio, startRow: t.fila_inicio })
    }, [plantillas])

    const handlePreview = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e?.target?.files?.[0] || file
        if (!selectedFile) return
        setFile(selectedFile); setLoading(true)
        const formData = new FormData(); formData.append('file', selectedFile)
        if (user?.id) formData.append('user_id', user.id)
        if (proveedorSel) formData.append('proveedor_nombre', proveedorSel)
        try {
            const res = await fetch('https://api.kokihawk.com.ar/upload-excel', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.status === 'success') {
                setSessionId(data.session_id)
                setPreviewData(data.filas)
                if (data.sheets && data.sheets.length > 1) {
                    setExcelSheets(data.sheets)
                    setSelectedSheet(data.selected_sheet || data.sheets[0])
                } else {
                    setExcelSheets([])
                    setSelectedSheet('')
                }
                setProviderMemory(data.provider_memory || null)
                setSmartMapping(data.smart_mapping || null)
                // ── Pre-fill mapping from provider memory or smart mapping ──
                const pm = data.provider_memory
                const sm = data.smart_mapping
                let source: 'memory' | 'smart' | null = null
                if (pm?.col_sku != null && pm.col_sku !== -1) {
                    setMapping({
                        sku: pm.col_sku,
                        desc: pm.col_desc ?? -1,
                        precio: pm.col_precio ?? -1,
                        startRow: pm.fila_inicio ?? 0,
                    })
                    source = 'memory'
                    if (pm.aumento_default) setAumento(pm.aumento_default)
                    if (pm.redondeo_default) setRedondeo(pm.redondeo_default)
                    if (pm.ajuste_meli_default) setAjusteMeli(pm.ajuste_meli_default)
                    if (pm.ajuste_tn_default) setAjusteTN(pm.ajuste_tn_default)
                } else if (sm?.col_sku != null && sm.col_sku !== -1) {
                    setMapping({
                        sku: sm.col_sku,
                        desc: sm.col_desc ?? -1,
                        precio: sm.col_precio ?? -1,
                        startRow: sm.fila_inicio ?? 0,
                    })
                    source = 'smart'
                }
                setAutoDetectSource(source)
                setStep(2)
            }
            else throw new Error(data.mensaje)
        } catch { toast.error('Error al leer el archivo.') } finally { setLoading(false) }
    }

    const handleSheetChange = async (sheetName: string) => {
        if (!sessionId) return
        setSelectedSheet(sheetName)
        setLoading(true)
        const formData = new FormData(); formData.append('session_id', sessionId)
        formData.append('sheet_name', sheetName)
        try {
            const res = await fetch('https://api.kokihawk.com.ar/preview-lista', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.status === 'success') {
                setPreviewData(data.filas)
            } else throw new Error(data.mensaje)
        } catch { toast.error('Error al leer la hoja.') } finally { setLoading(false) }
    }

    const handleProcess = async () => {
        if (!sessionId || mapping.sku === -1 || mapping.precio === -1) return
        setLoading(true)
        const formData = new FormData()
        formData.append('session_id', sessionId)
        formData.append('proveedor', proveedorSel || 'generico')
        formData.append('user_id', user.id)
        formData.append('aumento', aumento)
        formData.append('ajuste_meli', ajusteMeli)
        formData.append('ajuste_tn', ajusteTN)
        formData.append('redondeo', redondeo)
        formData.append('col_sku', mapping.sku.toString())
        formData.append('col_desc', mapping.desc.toString())
        formData.append('col_precio', mapping.precio.toString())
        formData.append('fila_inicio', mapping.startRow.toString())
        if (selectedSheet) formData.append('sheet_name', selectedSheet)

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
                if (data._catalog_maps) setCatalogMaps(data._catalog_maps)
                setStep(3)
            } else throw new Error(data.mensaje)
        } catch { toast.error('Error al procesar.') } finally { setLoading(false) }
    }

    const [lastBatchId, setLastBatchId] = useState<string | null>(null)

    const handleSaveCatalogo = async (mode: 'linked' | 'all') => {
        if (!results.length) return
        setLoading(true)
        try {
            const prov = proveedorSel || 'General'
            const batchId = crypto.randomUUID()
            const source = mode === 'linked'
                ? results.filter(p => p.sku_meli || p.sku_tn)
                : results

            if (!source.length) {
                toast.error('No hay productos para guardar con esta opción.')
                return
            }

            const uniqueDataMap = new Map()
            source.forEach(p => {
                const cleanSku = p.sku.toString().trim().toUpperCase()
                uniqueDataMap.set(cleanSku, {
                    user_id: user.id, sku: cleanSku, proveedor: prov,
                    batch_id: batchId,
                    descripcion: p.descripcion, precio_final: p.precio_final,
                    precio_meli: p.precio_meli ?? null,
                    precio_tn: p.precio_tn ?? null,
                    sku_meli: p.sku_meli ?? null,
                    sku_tn: p.sku_tn ?? null,
                    plataformas: p.plataformas || [],
                })
            })
            const dataToSave = Array.from(uniqueDataMap.values())
            for (let i = 0; i < dataToSave.length; i += 1000) {
                const { error } = await supabase.from('catalogo_precios').upsert(
                    dataToSave.slice(i, i + 1000),
                    { onConflict: 'user_id, sku, proveedor' }
                )
                if (error) throw error
            }
            setLastBatchId(batchId)
            toast.success(`¡Catálogo guardado! (${prov}) — ${dataToSave.length} productos · Lote ${batchId.slice(0, 8)}`)
        } catch (err: any) { toast.error('Error al guardar en el catálogo: ' + err.message) }
        finally { setLoading(false) }
    }

    const handleUndoLastImport = async () => {
        if (!lastBatchId) return
        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const jwt = session?.access_token
            if (!jwt) { toast.error('Sesión expirada. Recargá la página.'); return }

            const res = await fetch(`https://api.kokihawk.com.ar/catalogo/importacion/${lastBatchId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${jwt}` },
            })
            const data = await res.json()
            if (res.ok && data.status === 'ok') {
                toast.success(`✓ Importación deshecha — ${data.eliminados} productos eliminados del catálogo`)
                setLastBatchId(null)
            } else {
                toast.error('Error al deshacer: ' + (data.error ?? 'Intentalo de nuevo'))
            }
        } catch { toast.error('Error de red al deshacer la importación') }
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
        } catch { toast.error('Error al descargar') } finally { setLoading(false) }
    }

    // ── Sync TiendaNube (Job Queue) — solo envía productos con match ──
    const handleSyncTiendaNube = async () => {
        if (!integraciones?.tiendanube_access_token) {
            window.location.href = 'https://www.tiendanube.com/apps/30786/authorize'; return
        }
        const tnProducts = results.filter(p => p.tn_product_id && p.tn_variant_id)
        if (!tnProducts.length) { toast.error('No hay productos con match en Tienda Nube.'); return }
        // defer to modal
        setConfirmModal({
            title: 'Sincronizar Tienda Nube',
            desc: `¿Actualizar ${tnProducts.length} precios en Tienda Nube?`,
            action: () => _doSyncTN(tnProducts),
        })
    }

    const _doSyncTN = async (tnProducts: any[]) => {
        setConfirmModal(null)

        const fileName = file?.name || 'manual'
        try {
            const res = await fetch('https://api.kokihawk.com.ar/sincronizar-tiendanube', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_token: integraciones.tiendanube_access_token,
                    store_id: integraciones.tiendanube_store_id,
                    productos: tnProducts,
                    user_id: user.id,
                    file_name: fileName,
                }),
            })
            const data = await res.json()
            if (data.job_id) {
                addJob({ job_id: data.job_id, plataforma: 'tn', file_name: fileName })
            } else {
                toast.error('Error al encolar: ' + (data.mensaje ?? 'desconocido'))
            }
        } catch (err) {
            toast.error('Error de red al sincronizar TN')
        }
    }

    // ── Sync MeLi (Job Queue) — solo envía productos con match ──
    const handleSyncMeLi = async () => {
        if (!integraciones?.meli_access_token) {
            window.location.href = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=3703622904525600&redirect_uri=https://api.kokihawk.com.ar/meli/callback`; return
        }
        const meliProducts = results.filter(p => p.meli_item_id)
        if (!meliProducts.length) { toast.error('No hay productos con match en Mercado Libre.'); return }
        setConfirmModal({
            title: 'Sincronizar Mercado Libre',
            desc: `¿Actualizar ${meliProducts.length} precios en Mercado Libre?`,
            action: () => _doSyncMeLi(meliProducts),
        })
    }

    const _doSyncMeLi = async (meliProducts: any[]) => {
        setConfirmModal(null)

        const fileName = file?.name || 'manual'
        try {
            const res = await fetch('https://api.kokihawk.com.ar/sincronizar-meli', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_token: integraciones.meli_access_token,
                    refresh_token: integraciones.meli_refresh_token,
                    productos: meliProducts,
                    user_id: user.id,
                    file_name: fileName,
                }),
            })
            const data = await res.json()
            if (data.job_id) {
                addJob({ job_id: data.job_id, plataforma: 'meli', file_name: fileName })
            } else {
                toast.error('Error al encolar: ' + (data.mensaje ?? 'desconocido'))
            }
        } catch (err) {
            toast.error('Error de red al sincronizar MeLi')
        }
    }

    // ── Edición por INDEX del array (no por SKU) ──
    const updateField = useCallback((index: number, field: string, value: any) => {
        setResults(prev => prev.map((p, i) => {
            if (i !== index) return p
            const updated = { ...p, [field]: value }

            // Live SKU lookup: when user edits sku_meli or sku_tn, re-match against catalog
            if (field === 'sku_meli' && catalogMaps?.meli) {
                const key = String(value || '').trim().toUpperCase()
                if (key && catalogMaps.meli.ids[key]) {
                    updated.meli_item_id = catalogMaps.meli.ids[key]
                    updated.precio_actual_meli = catalogMaps.meli.precios[key] ?? null
                    if (!updated.plataformas?.includes('meli')) {
                        updated.plataformas = [...(updated.plataformas || []), 'meli']
                    }
                } else {
                    updated.meli_item_id = null
                    updated.precio_actual_meli = null
                    updated.plataformas = (updated.plataformas || []).filter((x: string) => x !== 'meli')
                }
            }
            if (field === 'sku_tn' && catalogMaps?.tn) {
                const key = String(value || '').trim().toUpperCase()
                if (key && catalogMaps.tn.ids[key]) {
                    const [prodId, varId] = catalogMaps.tn.ids[key]
                    updated.tn_product_id = prodId
                    updated.tn_variant_id = varId
                    updated.precio_actual_tn = catalogMaps.tn.precios[key] ?? null
                    if (!updated.plataformas?.includes('tn')) {
                        updated.plataformas = [...(updated.plataformas || []), 'tn']
                    }
                } else {
                    updated.tn_product_id = null
                    updated.tn_variant_id = null
                    updated.precio_actual_tn = null
                    updated.plataformas = (updated.plataformas || []).filter((x: string) => x !== 'tn')
                }
            }
            return updated
        }))
    }, [catalogMaps])

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
                String(p.sku_meli ?? '').toLowerCase().includes(q) ||
                String(p.sku_tn ?? '').toLowerCase().includes(q) ||
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

    const autoAppliedCols = useMemo(() => ({
        sku: autoDetectSource === 'memory' ? providerMemory?.col_sku : autoDetectSource === 'smart' ? smartMapping?.col_sku : undefined,
        desc: autoDetectSource === 'memory' ? providerMemory?.col_desc : autoDetectSource === 'smart' ? smartMapping?.col_desc : undefined,
        precio: autoDetectSource === 'memory' ? providerMemory?.col_precio : autoDetectSource === 'smart' ? smartMapping?.col_precio : undefined,
        startRow: autoDetectSource === 'memory' ? providerMemory?.fila_inicio : autoDetectSource === 'smart' ? smartMapping?.fila_inicio : undefined,
    }), [autoDetectSource, providerMemory, smartMapping])

    // ── Detección de SKUs duplicados ──
    const duplicateSkus = useMemo(() => {
        const counts: Record<string, number> = {}
        results.forEach(p => {
            const key = String(p.sku_proveedor ?? p.sku ?? '').trim().toUpperCase()
            if (key && key !== 'NAN') counts[key] = (counts[key] || 0) + 1
        })
        return Object.entries(counts).filter(([, c]) => c > 1).map(([sku]) => sku)
    }, [results])
    const hasDuplicates = duplicateSkus.length > 0

    const canSync = legalConfirmed && !loading && !hasDuplicates

    const meliMatchCount = useMemo(() => results.filter(p => p.meli_item_id).length, [results])
    const tnMatchCount = useMemo(() => results.filter(p => p.tn_product_id && p.tn_variant_id).length, [results])

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
                <div className="max-w-xl mx-auto space-y-6 mt-4 md:mt-8">
                    {/* ── Proveedor selector ── */}
                    <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                <DatabaseZap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-foreground">Seleccioná el proveedor</h3>
                                <p className="text-[10px] text-muted-foreground">Elegí un proveedor existente o creá uno nuevo para continuar</p>
                            </div>
                        </div>
                        {showNewProv ? (
                            <div className="flex gap-2">
                                <Input type="text" value={newProvName} onChange={(e) => setNewProvName(e.target.value)}
                                    placeholder="Nombre del proveedor..." autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && crearProveedor()}
                                    className="h-10 text-sm bg-secondary/40 border-border/60 focus:border-primary/50 flex-1" />
                                <Button size="sm" onClick={crearProveedor} disabled={!newProvName.trim()} className="h-10 px-4 bg-primary hover:bg-primary/90 text-xs font-bold">
                                    Crear
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setShowNewProv(false); setNewProvName('') }} className="h-10 px-3 text-xs">
                                    Cancelar
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <select value={proveedorSel} onChange={(e) => setProveedorSel(e.target.value)}
                                    className="h-10 flex-1 text-sm font-medium border border-border/60 rounded-lg px-3 outline-none bg-secondary/40 text-foreground focus:border-primary/50">
                                    <option value="">Seleccionar proveedor...</option>
                                    {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                                </select>
                                <button onClick={() => setShowNewProv(true)} title="Crear proveedor"
                                    className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors text-lg font-medium">+</button>
                            </div>
                        )}
                    </div>

                    {/* ── Upload area ── */}
                    <div className={!proveedorSel ? 'pointer-events-none opacity-40' : ''}>
                        {!proveedorSel && (
                            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-2.5 mb-4">
                                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                <p className="text-xs font-semibold text-amber-400">Seleccioná un proveedor para habilitar la carga de archivos</p>
                            </div>
                        )}
                        <div className="text-center space-y-2 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                                <FileSpreadsheet className="h-7 w-7 text-primary" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Motor de Listas</h1>
                            <p className="text-muted-foreground text-base">Subí tu lista de precios en Excel o CSV para comenzar.</p>
                        </div>
                        <div
                            onClick={() => proveedorSel && fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); if (proveedorSel) setIsDragging(true) }}
                            onDragEnter={(e) => { e.preventDefault(); if (proveedorSel) setIsDragging(true) }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault(); setIsDragging(false)
                                if (!proveedorSel) { toast.error('Seleccioná un proveedor primero'); return }
                                const droppedFile = e.dataTransfer.files?.[0]
                                if (droppedFile) {
                                    const ext = droppedFile.name.split('.').pop()?.toLowerCase()
                                    if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
                                        setFile(droppedFile); setLoading(true)
                                        const formData = new FormData(); formData.append('file', droppedFile)
                                        if (user?.id) formData.append('user_id', user.id)
                                        if (proveedorSel) formData.append('proveedor_nombre', proveedorSel)
                                        fetch('https://api.kokihawk.com.ar/upload-excel', { method: 'POST', body: formData })
                                            .then(r => r.json()).then(data => {
                                                if (data.status === 'success') {
                                                    setSessionId(data.session_id)
                                                    setPreviewData(data.filas)
                                                    if (data.sheets && data.sheets.length > 1) {
                                                        setExcelSheets(data.sheets)
                                                        setSelectedSheet(data.selected_sheet || data.sheets[0])
                                                    }
                                                    setProviderMemory(data.provider_memory || null)
                                                    setSmartMapping(data.smart_mapping || null)
                                                    const pm = data.provider_memory
                                                    const sm = data.smart_mapping
                                                    let source: 'memory' | 'smart' | null = null
                                                    if (pm?.col_sku != null && pm.col_sku !== -1) {
                                                        setMapping({ sku: pm.col_sku, desc: pm.col_desc ?? -1, precio: pm.col_precio ?? -1, startRow: pm.fila_inicio ?? 0 })
                                                        source = 'memory'
                                                        if (pm.aumento_default) setAumento(pm.aumento_default)
                                                        if (pm.redondeo_default) setRedondeo(pm.redondeo_default)
                                                        if (pm.ajuste_meli_default) setAjusteMeli(pm.ajuste_meli_default)
                                                        if (pm.ajuste_tn_default) setAjusteTN(pm.ajuste_tn_default)
                                                    } else if (sm?.col_sku != null && sm.col_sku !== -1) {
                                                        setMapping({ sku: sm.col_sku, desc: sm.col_desc ?? -1, precio: sm.col_precio ?? -1, startRow: sm.fila_inicio ?? 0 })
                                                        source = 'smart'
                                                    }
                                                    setAutoDetectSource(source)
                                                    setStep(2)
                                                }
                                                else toast.error(data.mensaje || 'Error al leer')
                                            }).catch(() => toast.error('Error al leer el archivo.')).finally(() => setLoading(false))
                                    } else { toast.error('Formato no soportado. Usá .xlsx, .xls o .csv.') }
                                }
                            }}
                            className={`group relative border-2 border-dashed rounded-2xl bg-card transition-all duration-200 cursor-pointer overflow-hidden ${isDragging
                                ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg shadow-primary/10'
                                : 'border-border/60 hover:border-primary/50 hover:bg-primary/3'
                            }`}>
                            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 24px, currentColor 24px, currentColor 25px), repeating-linear-gradient(90deg, transparent, transparent 24px, currentColor 24px, currentColor 25px)` }} />
                            <div className="relative p-12 md:p-16 flex flex-col items-center gap-5 text-center">
                                <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-all duration-200 ${isDragging
                                    ? 'bg-primary/15 border-primary/30 scale-110'
                                    : 'bg-primary/8 border-primary/15 group-hover:bg-primary/12 group-hover:scale-105'
                                }`}>
                                    <Upload className={`h-7 w-7 text-primary transition-transform ${isDragging ? 'animate-bounce' : ''}`} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-foreground">{isDragging ? 'Soltá el archivo acá' : 'Arrastrá tu archivo o hacé clic para elegir'}</p>
                                    <p className="text-xs text-muted-foreground">Formatos: <span className="font-mono font-bold">.xlsx</span> · <span className="font-mono font-bold">.xls</span> · <span className="font-mono font-bold">.csv</span></p>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handlePreview} className="hidden" accept=".xlsx,.xls,.csv" />
                                <Button size="lg" disabled={loading}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 h-11 px-8 pointer-events-none">
                                    {loading ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Leyendo...</> : 'Elegir Archivo'}
                                </Button>
                            </div>
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
                <div className="space-y-5">
                    {/* ── Top bar: back + actions ── */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-muted-foreground h-9">
                            <ArrowLeft className="h-4 w-4 mr-1.5" /> Cambiar archivo
                        </Button>
                        <div className="flex items-center gap-2">
                            {showPlantillaInput ? (
                                <div className="flex items-end gap-1.5">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-semibold text-muted-foreground">Nombre</Label>
                                        <Input type="text" value={plantillaName} onChange={(e) => setPlantillaName(e.target.value)}
                                            placeholder="Mi plantilla..." autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && guardarPlantilla()}
                                            className="h-9 w-36 text-xs bg-secondary/40 border-border/60 focus:border-primary/50" />
                                    </div>
                                    <Button size="sm" onClick={guardarPlantilla} className="h-9 px-3 bg-primary hover:bg-primary/90 text-xs font-bold">
                                        <Save className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setShowPlantillaInput(false); setPlantillaName('') }} className="h-9 px-2 text-xs">
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="outline" onClick={() => setShowPlantillaInput(true)} disabled={!canProcess} size="sm"
                                    className="border-border/60 text-xs font-bold gap-1.5">
                                    <Save className="h-3.5 w-3.5" /> Guardar mapeo
                                </Button>
                            )}
                            <Button onClick={handleProcess} disabled={loading || !canProcess}
                                className="bg-primary hover:bg-primary/90 font-bold shadow-md shadow-primary/20 gap-1.5 text-sm">
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Zap className="h-4 w-4" />}
                                Calcular Precios
                            </Button>
                        </div>
                    </div>

                    {/* ── Sheet selector ── */}
                    {excelSheets.length > 1 && (
                        <div className="flex items-center gap-3 bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5">
                            <FileSpreadsheet className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs font-semibold text-muted-foreground">Hoja:</span>
                            <select value={selectedSheet} onChange={e => handleSheetChange(e.target.value)}
                                className="text-xs font-semibold bg-background border border-border/60 rounded-lg px-3 py-1.5 text-foreground">
                                {excelSheets.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <span className="text-[10px] text-muted-foreground/50">
                                {excelSheets.length} hojas detectadas
                            </span>
                        </div>
                    )}

                    {/* ── Settings grid ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Card: Configuración */}
                        <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Configuración</h3>
                            <div className="space-y-3.5">
                                <div>
                                    <Label className="text-[11px] font-semibold">Proveedor</Label>
                                    {showNewProv ? (
                                        <div className="flex gap-1 mt-1">
                                            <Input type="text" value={newProvName} onChange={(e) => setNewProvName(e.target.value)}
                                                placeholder="Nombre..." autoFocus onKeyDown={(e) => e.key === 'Enter' && crearProveedor()}
                                                className="h-9 w-32 text-sm bg-secondary/40 border-border/60 focus:border-primary/50" />
                                            <Button size="sm" onClick={crearProveedor} className="h-9 px-2 bg-primary hover:bg-primary/90 text-xs font-bold">✓</Button>
                                            <Button size="sm" variant="ghost" onClick={() => setShowNewProv(false)} className="h-9 px-2 text-xs">✕</Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-1 mt-1">
                                            <select value={proveedorSel} onChange={(e) => setProveedorSel(e.target.value)}
                                                className="h-9 w-full text-sm font-medium border border-border/60 rounded-lg px-3 outline-none bg-secondary/40 text-foreground focus:border-primary/50">
                                                <option value="">Seleccionar...</option>
                                                {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                                            </select>
                                            <button onClick={() => setShowNewProv(true)} title="Crear proveedor"
                                                className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-lg border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors text-lg font-medium">+</button>
                                        </div>
                                    )}
                                </div>
                                {plantillas.length > 0 && (
                                    <div>
                                        <Label className="text-[11px] font-semibold">Plantilla guardada</Label>
                                        <select onChange={(e) => cargarPlantilla(e.target.value)}
                                            className="mt-1 h-9 w-full text-sm font-medium border border-border/60 rounded-lg px-3 outline-none bg-secondary/40 text-foreground focus:border-primary/50">
                                            <option value="">Seleccionar...</option>
                                            {plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                        </select>
                                    </div>
                                )}
                                {diccionarios.length > 0 && (
                                    <div>
                                        <Label className="text-[11px] font-semibold">Diccionario SKUs</Label>
                                        <select value={diccionarioSelId} onChange={e => setDiccionarioSelId(e.target.value)}
                                            className="mt-1 h-9 w-full text-sm font-medium border border-border/60 rounded-lg px-3 outline-none bg-secondary/40 text-foreground focus:border-primary/50">
                                            <option value="">Sin diccionario</option>
                                            {diccionarios.map(d => (
                                                <option key={d.id} value={d.id}>{d.nombre_proveedor}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card: Ajustes */}
                        <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4 relative">
                            {autoDetectSource === 'memory' && (
                                <span className="absolute top-3 right-3 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">📦 Pre-cargado</span>
                            )}
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ajustes de precios</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-[11px] font-semibold">Aumento %</Label>
                                    <Input type="number" value={aumento} onChange={(e) => setAumento(e.target.value)}
                                        className={`mt-1 h-9 font-medium text-sm bg-secondary/40 border-border/60 focus:border-primary/50 ${autoDetectSource === 'memory' && providerMemory?.aumento_default ? 'ring-1 ring-emerald-500/30 border-emerald-500/40' : ''}`} />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Redondeo</Label>
                                    <select value={redondeo} onChange={(e) => setRedondeo(e.target.value)}
                                        className={`mt-1 h-9 w-full text-sm font-medium border border-border/60 rounded-lg px-3 outline-none bg-secondary/40 text-foreground focus:border-primary/50 ${autoDetectSource === 'memory' && providerMemory?.redondeo_default ? 'ring-1 ring-emerald-500/30 border-emerald-500/40' : ''}`}>
                                        <option value="0">Sin redondeo</option>
                                        <option value="10">A la decena ($10)</option>
                                        <option value="50">A los $50</option>
                                        <option value="100">A la centena ($100)</option>
                                        <option value="1000">Al millar ($1000)</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Ajuste MeLi %</Label>
                                    <Input type="number" value={ajusteMeli} onChange={(e) => setAjusteMeli(e.target.value)} placeholder="0"
                                        className={`mt-1 h-9 font-medium text-sm bg-secondary/40 border-border/60 focus:border-primary/50 ${autoDetectSource === 'memory' && providerMemory?.ajuste_meli_default ? 'ring-1 ring-emerald-500/30 border-emerald-500/40' : ''}`} />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Ajuste TN %</Label>
                                    <Input type="number" value={ajusteTN} onChange={(e) => setAjusteTN(e.target.value)} placeholder="0"
                                        className={`mt-1 h-9 font-medium text-sm bg-secondary/40 border-border/60 focus:border-primary/50 ${autoDetectSource === 'memory' && providerMemory?.ajuste_tn_default ? 'ring-1 ring-emerald-500/30 border-emerald-500/40' : ''}`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Card: Mapeo de columnas ── */}
                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mapeo de columnas</h3>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full bg-blue-500 ${mapping.sku === -1 ? 'opacity-30' : ''}`} />
                                        <span className={`text-[10px] font-bold ${mapping.sku !== -1 ? 'text-foreground' : 'text-muted-foreground/50'}`}>CÓDIGO</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full bg-emerald-500 ${mapping.desc === -1 ? 'opacity-30' : ''}`} />
                                        <span className={`text-[10px] font-bold ${mapping.desc !== -1 ? 'text-foreground' : 'text-muted-foreground/50'}`}>DESC.</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full bg-primary ${mapping.precio === -1 ? 'opacity-30' : ''}`} />
                                        <span className={`text-[10px] font-bold ${mapping.precio !== -1 ? 'text-foreground' : 'text-muted-foreground/50'}`}>PRECIO</span>
                                    </div>
                                </div>
                            </div>
                            {!canProcess && <p className="text-[10px] text-muted-foreground/40">Asigná cada columna usando los botones de abajo</p>}
                            {autoDetectSource && (
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${autoDetectSource === 'memory'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                                }`}>
                                    {autoDetectSource === 'memory' ? '📦 Memoria proveedor' : '🤖 Mapeo inteligente'}
                                </span>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse min-w-[400px]">
                                <thead>
                                    <tr className="border-b border-border/60 bg-secondary/30">
                                        <th className="w-16 p-3 text-left font-bold text-[10px] text-muted-foreground border-r border-border/30">Fila</th>
                                        {previewData[0]?.map((_: any, idx: number) => (
                                            <th key={idx} className="p-2.5 border-r border-border/30 min-w-[130px]">
                                                <div className="flex flex-col gap-1.5 items-center">
                                                    <span className="text-[9px] font-bold text-muted-foreground/50">Col. {idx + 1}</span>
                                                    <div className="flex gap-1">
                                                        <MappingButton label="Cód" color="blue" active={mapping.sku === idx} autoDetected={autoAppliedCols.sku === idx && mapping.sku !== idx} onClick={() => setMapping(m => ({ ...m, sku: idx }))} />
                                                        <MappingButton label="Desc" color="green" active={mapping.desc === idx} autoDetected={autoAppliedCols.desc === idx && mapping.desc !== idx} onClick={() => setMapping(m => ({ ...m, desc: idx }))} />
                                                        <MappingButton label="Precio" color="orange" active={mapping.precio === idx} autoDetected={autoAppliedCols.precio === idx && mapping.precio !== idx} onClick={() => setMapping(m => ({ ...m, precio: idx }))} />
                                                    </div>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((fila, fIdx) => (
                                        <tr key={fIdx} onClick={() => setMapping(m => ({ ...m, startRow: fIdx }))}
                                            className={`cursor-pointer border-b border-border/15 transition-colors ${mapping.startRow === fIdx ? 'bg-primary/5' : 'hover:bg-secondary/10'}`}>
                                            <td className="p-3 border-r border-border/15 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {autoAppliedCols.startRow === fIdx && mapping.startRow !== fIdx && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title="Fila de inicio sugerida por IA" />
                                                    )}
                                                    {mapping.startRow === fIdx
                                                        ? <span className="text-[9px] font-black text-primary bg-primary/8 px-2 py-0.5 rounded-md">▶ INICIO</span>
                                                        : <span className="text-[10px] text-muted-foreground/30">{fIdx + 1}</span>
                                                    }
                                                </div>
                                            </td>
                                            {fila.map((c: any, cIdx: number) => (
                                                <td key={cIdx} className={`p-3 text-xs border-r border-border/10 font-medium truncate max-w-[180px] ${mapping.sku === cIdx ? 'text-blue-400' : mapping.desc === cIdx ? 'text-emerald-400' : mapping.precio === cIdx ? 'text-primary' : 'text-muted-foreground/50'}`}>
                                                    {c}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-2.5 bg-secondary/20 border-t border-border/40 flex items-center gap-2">
                            <Info className="h-3 w-3 text-muted-foreground/40" />
                            <p className="text-[10px] text-muted-foreground/50">Hacé clic en una fila para marcarla como fila de inicio de datos.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
                <div className="space-y-4">

                    {/* Banner bloqueante: SKUs duplicados */}
                    {hasDuplicates && (
                        <div className="flex items-start gap-3 bg-red-500/10 border-2 border-red-500/40 rounded-2xl p-4 animate-pulse">
                            <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                                <ShieldAlert className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-red-500">
                                    ⛔ {duplicateSkus.length} SKU{duplicateSkus.length > 1 ? 's' : ''} duplicado{duplicateSkus.length > 1 ? 's' : ''} — Sincronización bloqueada
                                </p>
                                <p className="text-xs text-red-400/80 mt-0.5 leading-relaxed">
                                    Corregí tu Excel: los siguientes códigos aparecen más de una vez:{' '}
                                    <span className="font-mono font-bold">{duplicateSkus.slice(0, 5).join(', ')}</span>
                                    {duplicateSkus.length > 5 && <span> y {duplicateSkus.length - 5} más</span>}
                                </p>
                            </div>
                        </div>
                    )}

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
                                    <span className="text-xs font-bold text-muted-foreground ml-2">
                                        ({meliMatchCount} MeLi · {tnMatchCount} TN)
                                    </span>
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
                                <Button onClick={() => setConfirmModal({
                                    title: 'Guardar solo vinculados',
                                    desc: `Se guardarán solo los productos que tengan SKU MeLi o SKU TN asignado (${results.filter(p => p.sku_meli || p.sku_tn).length} productos). ¿Continuar?`,
                                    action: () => handleSaveCatalogo('linked'),
                                })} disabled={loading || !results.length} variant="outline" size="sm"
                                    className="border-violet-500/30 text-violet-400 hover:bg-violet-500/8 text-xs font-bold gap-1.5">
                                    <DatabaseZap className="h-3.5 w-3.5" /> Solo Vinculados
                                </Button>
                                <Button onClick={() => setConfirmModal({
                                    title: 'Guardar todo el catálogo',
                                    desc: `Se guardarán los ${results.length} productos procesados en el catálogo (proveedor: ${proveedorSel || 'General'}). ¿Continuar?`,
                                    action: () => handleSaveCatalogo('all'),
                                })} disabled={loading || !results.length} variant="outline" size="sm"
                                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/8 text-xs font-bold gap-1.5">
                                    <Save className="h-3.5 w-3.5" /> Guardar Todo
                                </Button>
                                {lastBatchId && (
                                    <Button onClick={() => setConfirmModal({
                                        title: 'Deshacer última importación',
                                        desc: `Se eliminarán todos los productos del lote ${lastBatchId.slice(0, 8)}… del catálogo. Esta acción no se puede revertir.`,
                                        action: handleUndoLastImport,
                                    })} variant="outline" size="sm"
                                        className="border-red-500/30 text-red-400 hover:bg-red-500/8 text-xs font-bold gap-1.5">
                                        <Undo2 className="h-3.5 w-3.5" /> Deshacer
                                    </Button>
                                )}
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
                            <table className="w-full text-sm border-collapse min-w-[1000px]">
                                <thead className="bg-secondary/50 sticky top-0 border-b border-border/60 z-10">
                                    <tr>
                                        <th className="w-8 p-3" />
                                        <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Plat.</th>
                                        <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">SKU Prov.</th>
                                        <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground max-w-[160px]">Descripción</th>
                                        <th className="text-right p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Costo</th>
                                        <th className="text-right p-3 text-[9px] font-black uppercase tracking-widest text-primary"><span className="inline-flex items-center gap-1"><Image src="/logos/icon.png" alt="KH" width={14} height={14} className="rounded-sm" /> Venta</span></th>
                                        <th className="text-right p-3 text-[9px] font-black uppercase tracking-widest text-amber-400"><span className="inline-flex items-center gap-1"><Image src="/logos/meli.png" alt="ML" width={14} height={14} className="rounded-sm" /> MeLi</span></th>
                                        <th className="text-right p-3 pr-4 text-[9px] font-black uppercase tracking-widest text-blue-400"><span className="inline-flex items-center gap-1"><Image src="/logos/tiendanube.png" alt="TN" width={14} height={14} className="rounded-sm" /> TN</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {paginatedResults.map((prod, i) => {
                                        const realIndex = results.indexOf(prod)
                                        const kinds = getAnomalies(prod)
                                        const hasProblems = kinds.length > 0

                                        return (
                                            <tr key={`${realIndex}-${prod.sku}`} className={`transition-colors ${hasProblems ? 'bg-red-500/4 hover:bg-red-500/6' : 'hover:bg-secondary/15'}`}>
                                                <td className="p-3 text-center">
                                                    {hasProblems && <AlertTriangle className="h-3.5 w-3.5 text-red-500 mx-auto" />}
                                                </td>
                                                <td className="p-3"><PlatformBadges plataformas={prod.plataformas} /></td>

                                                {/* SKU Proveedor */}
                                                <td className="p-3">
                                                    <span className="font-mono font-bold text-xs text-muted-foreground/70">{prod.sku_proveedor ?? prod.sku}</span>
                                                    {/* SKU overrides inline */}
                                                    <div className="flex gap-1 mt-1">
                                                        <input type="text" value={prod.sku_meli ?? ''} onChange={(e) => updateField(realIndex, 'sku_meli', e.target.value || null)}
                                                            placeholder="ML" title="SKU MeLi"
                                                            className="w-[60px] font-mono text-[10px] border border-border/30 rounded bg-transparent px-1 py-0.5 outline-none focus:border-amber-500/50 placeholder:text-amber-500/25 text-amber-400/80" />
                                                        <input type="text" value={prod.sku_tn ?? ''} onChange={(e) => updateField(realIndex, 'sku_tn', e.target.value || null)}
                                                            placeholder="TN" title="SKU TN"
                                                            className="w-[60px] font-mono text-[10px] border border-border/30 rounded bg-transparent px-1 py-0.5 outline-none focus:border-blue-500/50 placeholder:text-blue-500/25 text-blue-400/80" />
                                                    </div>
                                                </td>

                                                {/* Descripción */}
                                                <td className="p-3 max-w-[160px]">
                                                    <span className="text-xs text-muted-foreground/80 truncate block">{prod.descripcion}</span>
                                                    {kinds.includes('bajo_costo') && (
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded border text-red-500 bg-red-500/10 border-red-500/20 mt-1 inline-block">↓ BAJO COSTO</span>
                                                    )}
                                                    {kinds.includes('alto_costo') && (
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded border text-orange-500 bg-orange-500/10 border-orange-500/20 mt-1 inline-block">↑ ALTO COSTO</span>
                                                    )}
                                                </td>

                                                {/* Costo */}
                                                <td className="p-3 text-right align-top">
                                                    <span className="text-xs font-mono text-muted-foreground">${formatARS(prod.precio_original ?? 0)}</span>
                                                </td>

                                                {/* Precio Venta — editable */}
                                                <td className="p-3 text-right align-top">
                                                    <input type="number" value={prod.precio_final ?? ''}
                                                        onChange={(e) => updateField(realIndex, 'precio_final', parseFloat(e.target.value))}
                                                        className="w-[100px] text-right font-black rounded-lg border border-border/50 bg-transparent py-1 px-2 text-sm outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/40 tabular-nums" />
                                                </td>

                                                {/* Precio MeLi — actual + editable */}
                                                <td className="p-3 text-right align-top">
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        {prod.precio_actual_meli != null && (
                                                            <span className="text-[10px] text-amber-400/50 font-mono tabular-nums">
                                                                ${formatARS(prod.precio_actual_meli)}
                                                            </span>
                                                        )}
                                                        <input type="number" value={prod.precio_meli ?? ''}
                                                            onChange={(e) => updateField(realIndex, 'precio_meli', parseFloat(e.target.value))}
                                                            className="w-[100px] text-right font-bold rounded-lg border border-amber-500/30 bg-transparent py-1 px-2 text-sm outline-none focus:ring-1 focus:ring-amber-500/20 focus:border-amber-500/50 tabular-nums text-amber-300" />
                                                    </div>
                                                </td>

                                                {/* Precio TN — actual + editable */}
                                                <td className="p-3 pr-4 text-right align-top">
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        {prod.precio_actual_tn != null && (
                                                            <span className="text-[10px] text-blue-400/50 font-mono tabular-nums">
                                                                ${formatARS(prod.precio_actual_tn)}
                                                            </span>
                                                        )}
                                                        <input type="number" value={prod.precio_tn ?? ''}
                                                            onChange={(e) => updateField(realIndex, 'precio_tn', parseFloat(e.target.value))}
                                                            className="w-[100px] text-right font-bold rounded-lg border border-blue-500/30 bg-transparent py-1 px-2 text-sm outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/50 tabular-nums text-blue-300" />
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

            {/* ── Confirm Modal (reemplaza confirm() nativo) ── */}
            {confirmModal && (
                <ConfirmModal
                    open={!!confirmModal}
                    title={confirmModal.title}
                    description={confirmModal.desc}
                    confirmLabel="Sincronizar"
                    onConfirm={confirmModal.action}
                    onCancel={() => setConfirmModal(null)}
                />
            )}
        </div>
    )
}
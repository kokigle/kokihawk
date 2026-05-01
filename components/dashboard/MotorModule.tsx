import { useState, useRef, useMemo, useEffect, useDeferredValue, useTransition, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
    Loader2, Download, ArrowLeft, Save, Upload, CheckCircle2,
    Zap, AlertTriangle, DatabaseZap, Filter, FileSpreadsheet, Info
} from 'lucide-react'
import Image from 'next/image'
import { StepIndicator, MappingButton, PlatformBadges } from './SharedUI'

function isAnomaly(precioFinal: number, costoBase: number): false | 'bajo' | 'alto' {
    if (!costoBase || costoBase <= 0) return false
    if (precioFinal < costoBase) return 'bajo'
    if (precioFinal > costoBase * 2) return 'alto'
    return false
}

interface Props {
    user: any
    integraciones: any
    setIntegraciones: any
    setActiveModule: (m: string) => void
    step: number
    setStep: (s: number) => void
}

export default function MotorModule({ user, integraciones, setIntegraciones, setActiveModule, step, setStep }: Props) {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [aumento, setAumento] = useState('45')
    const [redondeo, setRedondeo] = useState('0')
    const [previewData, setPreviewData] = useState<any[]>([])
    const [mapping, setMapping] = useState({ sku: -1, desc: -1, precio: -1, startRow: 0 })
    const [results, setResults] = useState<any[]>([])
    const [filterMeli, setFilterMeli] = useState(false)
    const [filterTN, setFilterTN] = useState(false)
    const [plantillas, setPlantillas] = useState<any[]>([])

    // Deferred values for the results filter — keeps UI snappy while filtering large arrays
    const deferredFilterMeli = useDeferredValue(filterMeli)
    const deferredFilterTN = useDeferredValue(filterTN)
    const [, startTransition] = useTransition()

    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    useEffect(() => {
        if (user) {
            supabase.from('plantillas_mapeo').select('*').eq('user_id', user.id).then(({ data }) => {
                if (data) setPlantillas(data)
            })
        }
    }, [user]) // eslint-disable-line

    const guardarPlantilla = async () => {
        const nombre = prompt('Nombre de la plantilla:')
        if (!nombre) return
        const { error } = await supabase.from('plantillas_mapeo').insert({ user_id: user.id, nombre, col_sku: mapping.sku, col_desc: mapping.desc, col_precio: mapping.precio, fila_inicio: mapping.startRow })
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
        const { data: dicData } = await supabase.from('diccionario_skus').select('sku_proveedor, sku_ecommerce').eq('user_id', user.id)
        if (dicData && dicData.length > 0) formData.append('diccionario', JSON.stringify(dicData))
        try {
            const res = await fetch('https://api.kokihawk.com.ar/procesar-lista', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.status === 'success') {
                if (data.nuevos_tokens_meli) {
                    await supabase.from('integraciones_api').update({ meli_access_token: data.nuevos_tokens_meli.access_token, meli_refresh_token: data.nuevos_tokens_meli.refresh_token, updated_at: new Date().toISOString() }).eq('user_id', user.id)
                    setIntegraciones((prev: any) => ({ ...prev, meli_access_token: data.nuevos_tokens_meli.access_token, meli_refresh_token: data.nuevos_tokens_meli.refresh_token }))
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
                uniqueDataMap.set(cleanSku, { user_id: user.id, sku: cleanSku, descripcion: p.descripcion, precio_final: p.precio_final, plataformas: p.plataformas || [] })
            })
            const dataToSave = Array.from(uniqueDataMap.values())
            for (let i = 0; i < dataToSave.length; i += 1000) {
                const { error } = await supabase.from('catalogo_precios').upsert(dataToSave.slice(i, i + 1000), { onConflict: 'user_id, sku' })
                if (error) throw error
            }
            alert(`¡Catálogo actualizado! Se guardaron ${dataToSave.length} productos únicos.`)
        } catch (err: any) { alert('Error al guardar en el catálogo: ' + err.message) }
        finally { setLoading(false) }
    }

    const handleDownload = async () => {
        setLoading(true)
        try {
            const res = await fetch('https://api.kokihawk.com.ar/descargar-excel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(results) })
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = 'KokiHawk_Procesado.xlsx'; a.click()
        } catch { alert('Error al descargar') } finally { setLoading(false) }
    }

    const handleSyncTiendaNube = async () => {
        if (!integraciones?.tiendanube_access_token) { window.location.href = 'https://www.tiendanube.com/apps/30786/authorize'; return }
        if (!confirm(`¿Subir ${results.length} precios a Tienda Nube?`)) return
        setLoading(true)
        try {
            const res = await fetch('https://api.kokihawk.com.ar/sincronizar-tiendanube', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: integraciones.tiendanube_access_token, store_id: integraciones.tiendanube_store_id, productos: results }) })
            const data = await res.json()
            if (data.status === 'success') alert(`☁️ TN COMPLETADO:\n✅ Actualizados: ${data.stats.actualizados}\n❌ No encontrados: ${data.stats.no_encontrados}\n⚠️ Errores: ${data.stats.errores}`)
            else alert('Error: ' + data.mensaje)
        } catch { alert('Error de red.') } finally { setLoading(false) }
    }

    const handleSyncMeLi = async () => {
        if (!integraciones?.meli_access_token) { window.location.href = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=3703622904525600&redirect_uri=https://api.kokihawk.com.ar/meli/callback`; return }
        if (!confirm('¿Actualizar precios en Mercado Libre?')) return
        setLoading(true)
        try {
            const res = await fetch('https://api.kokihawk.com.ar/sincronizar-meli', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: integraciones.meli_access_token, refresh_token: integraciones.meli_refresh_token, productos: results }) })
            const data = await res.json()
            if (res.status === 401) { alert(data.mensaje); setIntegraciones((prev: any) => ({ ...prev, meli_access_token: null })) }
            else if (data.status === 'success') {
                if (data.nuevos_tokens) {
                    await supabase.from('integraciones_api').update({ meli_access_token: data.nuevos_tokens.access_token, meli_refresh_token: data.nuevos_tokens.refresh_token, updated_at: new Date().toISOString() }).eq('user_id', user.id)
                    setIntegraciones((prev: any) => ({ ...prev, meli_access_token: data.nuevos_tokens.access_token, meli_refresh_token: data.nuevos_tokens.refresh_token }))
                }
                alert(`📦 M.LIBRE COMPLETADO:\n\n✅ Actualizados: ${data.stats.actualizados}\n❌ No encontrados: ${data.stats.no_encontrados}\n⚠️ Errores: ${data.stats.errores}`)
            } else alert('Error de la API: ' + data.mensaje)
        } catch { alert('Error de red.') } finally { setLoading(false) }
    }

    // Use useCallback to avoid re-creating function every render
    const updatePrecioFinal = useCallback((sku: string, newValue: number) => {
        setResults(prev => prev.map(p => p.sku === sku ? { ...p, precio_final: newValue } : p))
    }, [])

    // Filter runs on DEFERRED values to keep switches snappy
    const processedResults = useMemo(() => {
        let filtered = [...results]
        if (deferredFilterMeli && !deferredFilterTN) filtered = filtered.filter(p => p.plataformas?.includes('meli'))
        else if (deferredFilterTN && !deferredFilterMeli) filtered = filtered.filter(p => p.plataformas?.includes('tn'))
        else if (deferredFilterMeli && deferredFilterTN) filtered = filtered.filter(p => p.plataformas?.includes('meli') || p.plataformas?.includes('tn'))
        // Sort anomalies to top
        return filtered.sort((a, b) => {
            const aA = !!isAnomaly(a.precio_final ?? 0, a.precio_original ?? 0)
            const bA = !!isAnomaly(b.precio_final ?? 0, b.precio_original ?? 0)
            return aA === bA ? 0 : aA ? -1 : 1
        })
    }, [results, deferredFilterMeli, deferredFilterTN])

    const anomalyCount = useMemo(() =>
        results.filter(p => !!isAnomaly(p.precio_final ?? 0, p.precio_original ?? 0)).length, [results])

    const isFilterPending = filterMeli !== deferredFilterMeli || filterTN !== deferredFilterTN
    const canProcess = mapping.sku !== -1 && mapping.precio !== -1

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

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative border-2 border-dashed border-border/60 rounded-2xl bg-card hover:border-primary/50 hover:bg-primary/3 transition-all duration-200 cursor-pointer overflow-hidden"
                    >
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

                    {/* Mapping legend */}
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

                    {/* Preview table */}
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
                                        <tr
                                            key={fIdx}
                                            onClick={() => setMapping(m => ({ ...m, startRow: fIdx }))}
                                            className={`cursor-pointer border-b border-border/20 transition-colors ${mapping.startRow === fIdx ? 'bg-primary/8' : 'hover:bg-secondary/20'}`}
                                        >
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
                                        {anomalyCount} anomalías — revisá los precios marcados
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
                                <div className="h-6 w-px bg-border/60 hidden lg:block" />
                                <button
                                    onClick={integraciones?.meli_access_token ? handleSyncMeLi : undefined}
                                    disabled={loading || !integraciones?.meli_access_token}
                                    title={!integraciones?.meli_access_token ? 'Conectá Mercado Libre en Integraciones' : ''}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all ${integraciones?.meli_access_token ? 'bg-[#FFE600] text-[#2D3277] hover:opacity-90 shadow-sm' : 'bg-secondary/60 text-muted-foreground opacity-50 cursor-not-allowed border border-border/50'}`}
                                >
                                    {loading ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Image src="/logos/meli.png" width={14} height={14} alt="meli" className="rounded-sm" />}
                                    {integraciones?.meli_access_token ? 'Actualizar MeLi' : 'MeLi sin conectar'}
                                </button>
                                <button
                                    onClick={integraciones?.tiendanube_access_token ? handleSyncTiendaNube : undefined}
                                    disabled={loading || !integraciones?.tiendanube_access_token}
                                    title={!integraciones?.tiendanube_access_token ? 'Conectá Tienda Nube en Integraciones' : ''}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all ${integraciones?.tiendanube_access_token ? 'bg-[#0070F0] text-white hover:opacity-90 shadow-sm' : 'bg-secondary/60 text-muted-foreground opacity-50 cursor-not-allowed border border-border/50'}`}
                                >
                                    {loading ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Image src="/logos/tiendanube.png" width={14} height={14} alt="tn" className="rounded-sm" />}
                                    {integraciones?.tiendanube_access_token ? 'Actualizar TN' : 'TN sin conectar'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filter bar */}
                    <div className="flex items-center gap-3 bg-card border border-border/60 rounded-2xl px-5 py-3 shadow-sm">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 flex-shrink-0">
                            <Filter className="h-3 w-3" /> Filtrar:
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <Switch
                                checked={filterMeli}
                                onCheckedChange={(v) => startTransition(() => setFilterMeli(v))}
                                className="scale-75"
                            />
                            <span className={`text-xs font-bold ${filterMeli ? 'text-amber-400' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}>Mercado Libre</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <Switch
                                checked={filterTN}
                                onCheckedChange={(v) => startTransition(() => setFilterTN(v))}
                                className="scale-75"
                            />
                            <span className={`text-xs font-bold ${filterTN ? 'text-blue-400' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}>Tienda Nube</span>
                        </label>
                        <span className={`ml-auto text-xs font-bold tabular-nums transition-opacity ${isFilterPending ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
                            {processedResults.length} / {results.length}
                        </span>
                    </div>

                    {/* Results table */}
                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                        <div className={`max-h-[520px] overflow-y-auto overflow-x-auto transition-opacity ${isFilterPending ? 'opacity-60' : 'opacity-100'}`}>
                            <table className="w-full text-sm border-collapse min-w-[580px]">
                                <thead className="bg-secondary/50 sticky top-0 border-b border-border/60 z-10">
                                    <tr>
                                        <th className="w-8 p-3" />
                                        <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Plataforma</th>
                                        <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">SKU</th>
                                        <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Descripción</th>
                                        <th className="text-right p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Costo</th>
                                        <th className="text-right p-3 pr-4 text-[9px] font-black uppercase tracking-widest text-primary">Precio Final ✏️</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {processedResults.map((prod, i) => {
                                        const anomaly = isAnomaly(prod.precio_final ?? 0, prod.precio_original ?? 0)
                                        return (
                                            <tr key={i} className={`transition-colors ${anomaly ? 'bg-red-500/4 hover:bg-red-500/6' : 'hover:bg-secondary/15'}`}>
                                                <td className="p-3 text-center">{anomaly && <AlertTriangle className="h-3.5 w-3.5 text-red-500 mx-auto" />}</td>
                                                <td className="p-3"><PlatformBadges plataformas={prod.plataformas} /></td>
                                                <td className="p-3"><span className="font-mono font-bold text-xs">{prod.sku}</span></td>
                                                <td className="p-3"><span className="text-xs text-muted-foreground/80 max-w-[200px] truncate block">{prod.descripcion}</span></td>
                                                <td className="p-3 text-right"><span className="text-xs font-mono text-muted-foreground">${prod.precio_original?.toLocaleString('es-AR')}</span></td>
                                                <td className="p-3 pr-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {anomaly && (
                                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${anomaly === 'bajo' ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-orange-500 bg-orange-500/10 border-orange-500/20'}`}>
                                                                {anomaly === 'bajo' ? '↓ BAJO' : '↑ ALTO'}
                                                            </span>
                                                        )}
                                                        <input
                                                            type="number"
                                                            value={prod.precio_final ?? ''}
                                                            onChange={(e) => updatePrecioFinal(prod.sku, parseFloat(e.target.value))}
                                                            className={`w-[100px] text-right font-black rounded-lg border bg-transparent py-1.5 px-2.5 text-sm outline-none transition-colors focus:ring-1 ${anomaly ? 'border-red-500/40 text-red-500 focus:ring-red-500/20 focus:border-red-500/60' : 'border-border/50 focus:ring-primary/20 focus:border-primary/40'}`}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
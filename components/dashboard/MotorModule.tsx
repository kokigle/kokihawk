import { useState, useRef, useMemo, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Loader2, MousePointer2, Download, ArrowLeft, Save, Upload, CheckCircle2, Zap, RefreshCw, Lock, AlertTriangle, DatabaseZap, Filter } from 'lucide-react'
import Image from 'next/image'
import { StepIndicator, MappingButton, PlatformBadges } from './SharedUI'

function isAnomaly(precioFinal: number, costoBase: number): false | 'bajo' | 'alto' {
    if (!costoBase || costoBase <= 0) return false
    if (precioFinal < costoBase) return 'bajo'
    if (precioFinal > costoBase * 2) return 'alto'
    return false
}

interface Props {
    user: any;
    integraciones: any;
    setIntegraciones: any;
    setActiveModule: (m: string) => void;
    step: number;
    setStep: (s: number) => void;
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

    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    useEffect(() => {
        if (user) {
            supabase.from('plantillas_mapeo').select('*').eq('user_id', user.id).then(({ data }) => {
                if (data) setPlantillas(data)
            })
        }
    }, [user, supabase])

    const guardarPlantilla = async () => {
        const nombre = prompt('Nombre de la plantilla:')
        if (!nombre) return
        const { error } = await supabase.from('plantillas_mapeo').insert({ user_id: user.id, nombre, col_sku: mapping.sku, col_desc: mapping.desc, col_precio: mapping.precio, fila_inicio: mapping.startRow })
        if (error) alert('Error al guardar')
        else { alert('¡Plantilla guardada!'); const { data } = await supabase.from('plantillas_mapeo').select('*').eq('user_id', user.id); setPlantillas(data || []) }
    }

    const cargarPlantilla = (id: string) => {
        const t = plantillas.find(p => p.id === id)
        if (t) setMapping({ sku: t.col_sku, desc: t.col_desc, precio: t.col_precio, startRow: t.fila_inicio })
    }

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
        formData.append('file', file); formData.append('proveedor', "generico"); formData.append('aumento', aumento); formData.append('redondeo', redondeo)
        formData.append('col_sku', mapping.sku.toString()); formData.append('col_desc', mapping.desc.toString()); formData.append('col_precio', mapping.precio.toString()); formData.append('fila_inicio', mapping.startRow.toString())

        if (integraciones?.meli_access_token) { formData.append('meli_token', integraciones.meli_access_token); formData.append('meli_refresh', integraciones.meli_refresh_token) }
        if (integraciones?.tiendanube_access_token) formData.append('tn_token', integraciones.tiendanube_access_token)
        if (integraciones?.tiendanube_store_id) formData.append('tn_store', integraciones.tiendanube_store_id)

        // --- LA MAGIA DEL DICCIONARIO ---
        const { data: dicData } = await supabase.from('diccionario_skus').select('sku_proveedor, sku_ecommerce').eq('user_id', user.id)
        if (dicData && dicData.length > 0) {
            formData.append('diccionario', JSON.stringify(dicData))
        }
        // --------------------------------

        try {
            const res = await fetch('https://api.kokihawk.com.ar/procesar-lista', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.status === 'success') {
                if (data.nuevos_tokens_meli) {
                    await supabase.from('integraciones_api').update({ meli_access_token: data.nuevos_tokens_meli.access_token, meli_refresh_token: data.nuevos_tokens_meli.refresh_token, updated_at: new Date().toISOString() }).eq('user_id', user.id)
                    setIntegraciones((prev: any) => ({ ...prev, meli_access_token: data.nuevos_tokens_meli.access_token, meli_refresh_token: data.nuevos_tokens_meli.refresh_token }))
                }
                setResults(data.productos); setStep(3)
            } else throw new Error(data.mensaje)
        } catch { alert('Error al procesar.') } finally { setLoading(false) }
    }

    const handleSaveCatalogo = async () => {
        if (!results.length) return
        setLoading(true)
        try {
            // 1. Usamos un Map para eliminar SKUs duplicados automáticamente
            const uniqueDataMap = new Map()

            results.forEach(p => {
                const cleanSku = p.sku.toString().trim().toUpperCase()
                // Al usar .set(), si el SKU ya existe, se pisa con la versión más nueva
                uniqueDataMap.set(cleanSku, {
                    user_id: user.id,
                    sku: cleanSku,
                    descripcion: p.descripcion,
                    precio_final: p.precio_final,
                    plataformas: p.plataformas || []
                })
            })

            // 2. Convertimos el Map de vuelta a un Array
            const dataToSave = Array.from(uniqueDataMap.values())

            // 3. Subimos en bloques (ahora 100% libres de duplicados)
            for (let i = 0; i < dataToSave.length; i += 1000) {
                const chunk = dataToSave.slice(i, i + 1000)
                const { error } = await supabase
                    .from('catalogo_precios')
                    .upsert(chunk, { onConflict: 'user_id, sku' })

                if (error) throw error
            }

            alert(`¡Catálogo interno actualizado con éxito! Se guardaron ${dataToSave.length} productos únicos.`)
        } catch (err: any) {
            alert('Error al guardar en el catálogo: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async () => {
        setLoading(true)
        try {
            const res = await fetch('https://api.kokihawk.com.ar/descargar-excel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(results) })
            const blob = await res.blob(); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'KokiHawk_Procesado.xlsx'; a.click()
        } catch { alert('Error al descargar') } finally { setLoading(false) }
    }

    const handleSyncTiendaNube = async () => {
        if (!integraciones?.tiendanube_access_token) { window.location.href = 'https://www.tiendanube.com/apps/30786/authorize'; return }
        if (!confirm(`¿Subir ${results.length} precios a Tienda Nube?`)) return
        setLoading(true)
        try {
            const payload = { access_token: integraciones.tiendanube_access_token, store_id: integraciones.tiendanube_store_id, productos: results }
            const res = await fetch('https://api.kokihawk.com.ar/sincronizar-tiendanube', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
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
            const payload = { access_token: integraciones.meli_access_token, refresh_token: integraciones.meli_refresh_token, productos: results }
            const res = await fetch('https://api.kokihawk.com.ar/sincronizar-meli', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
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

    const updatePrecioFinal = (sku: string, newValue: number) => setResults(prev => prev.map(p => p.sku === sku ? { ...p, precio_final: newValue } : p))

    const processedResults = useMemo(() => {
        let filtered = [...results]
        if (filterMeli && !filterTN) filtered = filtered.filter(p => p.plataformas?.includes('meli'))
        else if (filterTN && !filterMeli) filtered = filtered.filter(p => p.plataformas?.includes('tn'))
        else if (filterMeli && filterTN) filtered = filtered.filter(p => p.plataformas?.includes('meli') || p.plataformas?.includes('tn'))
        filtered.sort((a, b) => {
            const aHas = !!isAnomaly(a.precio_final ?? 0, a.precio_original ?? 0)
            const bHas = !!isAnomaly(b.precio_final ?? 0, b.precio_original ?? 0)
            return aHas === bHas ? 0 : aHas ? -1 : 1
        })
        return filtered
    }, [results, filterMeli, filterTN])

    const anomalyCount = useMemo(() => results.filter(p => !!isAnomaly(p.precio_final ?? 0, p.precio_original ?? 0)).length, [results])

    return (
        <div className="space-y-6 mt-4">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setActiveModule('hub')} className="text-muted-foreground hover:text-foreground gap-1.5 -ml-2"><ArrowLeft className="h-4 w-4" /> Volver al Hub</Button>
                <div className="hidden md:flex"><StepIndicator step={step} /></div>
            </div>

            {/* STEP 1 */}
            {step === 1 && (
                <div className="max-w-2xl mx-auto space-y-8 mt-4 md:mt-10">
                    <div className="text-center space-y-3">
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Motor de Listas</h1>
                        <p className="text-muted-foreground text-base">Subí tu lista de precios en Excel o CSV y comenzá.</p>
                    </div>
                    <div onClick={() => fileInputRef.current?.click()} className="relative group border-2 border-dashed border-border rounded-2xl bg-card hover:border-primary/60 hover:bg-primary/3 transition-all cursor-pointer overflow-hidden">
                        <div className="relative p-16 flex flex-col items-center gap-6 text-center">
                            <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                            <p className="text-sm font-semibold text-foreground">Hacé clic o arrastrá tu archivo (.xlsx, .xls, .csv)</p>
                            <input type="file" ref={fileInputRef} onChange={handlePreview} className="hidden" accept=".xlsx,.xls,.csv" />
                            <Button size="lg" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 h-12 px-8 pointer-events-none">
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Elegir Archivo'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
                <div className="space-y-5">
                    <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
                        <div className="flex flex-wrap items-end gap-4">
                            <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-muted-foreground -ml-2"><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
                            {plantillas.length > 0 && (
                                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-primary">Plantilla</Label>
                                    <select onChange={(e) => cargarPlantilla(e.target.value)} className="block text-sm font-semibold border rounded-lg px-3 py-2 outline-none"><option value="">Seleccionar</option>{plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                            )}
                            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">Aumento %</Label>
                                <Input type="number" value={aumento} onChange={(e) => setAumento(e.target.value)} className="h-9 w-24 font-bold text-sm bg-secondary/50" /></div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Redondeo</Label>
                                <select value={redondeo} onChange={(e) => setRedondeo(e.target.value)} className="block h-9 text-sm font-semibold border rounded-lg px-3 outline-none bg-secondary/50 text-foreground border-border hover:border-primary/50 transition-colors">
                                    <option value="0">Sin redondeo</option>
                                    <option value="10">A la decena ($10)</option>
                                    <option value="50">A los $50</option>
                                    <option value="100">A la centena ($100)</option>
                                    <option value="1000">Al millar ($1000)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={guardarPlantilla} disabled={mapping.sku === -1}><Save className="h-4 w-4 mr-2" /> Guardar mapeo</Button>
                            <Button onClick={handleProcess} disabled={loading || mapping.sku === -1 || mapping.precio === -1} className="bg-primary hover:bg-primary/90 font-bold">
                                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Zap className="h-4 w-4 mr-2" />} Calcular Precios
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[{ label: 'CÓDIGO', color: 'bg-blue-500', active: mapping.sku !== -1 }, { label: 'DESC.', color: 'bg-emerald-500', active: mapping.desc !== -1 }, { label: 'PRECIO', color: 'bg-primary', active: mapping.precio !== -1 }, { label: 'INICIO', color: 'bg-orange-400', active: true }].map(i => (
                            <div key={i.label} className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2"><div className={`w-2.5 h-2.5 rounded-full ${i.color} ${!i.active && i.label !== 'INICIO' ? 'opacity-30' : ''}`} /><span className="text-[10px] font-black uppercase text-muted-foreground">{i.label}</span></div>
                        ))}
                    </div>
                    <div className="bg-card border rounded-2xl overflow-hidden overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead><tr className="border-b bg-secondary/30"><th className="w-24 p-3 text-left font-bold text-[10px] text-muted-foreground border-r">Fila</th>{previewData[0]?.map((_: any, idx: number) => (<th key={idx} className="p-3 border-r min-w-[140px]"><div className="flex flex-col gap-1.5"><span className="text-[9px] font-bold text-muted-foreground">Col. {idx + 1}</span><div className="flex gap-1"><MappingButton label="Cód" color="blue" active={mapping.sku === idx} onClick={() => setMapping({ ...mapping, sku: idx })} /><MappingButton label="Desc" color="green" active={mapping.desc === idx} onClick={() => setMapping({ ...mapping, desc: idx })} /><MappingButton label="Precio" color="orange" active={mapping.precio === idx} onClick={() => setMapping({ ...mapping, precio: idx })} /></div></div></th>))}</tr></thead>
                            <tbody>{previewData.map((fila, fIdx) => (<tr key={fIdx} onClick={() => setMapping({ ...mapping, startRow: fIdx })} className={`cursor-pointer border-b ${mapping.startRow === fIdx ? 'bg-primary/10' : 'hover:bg-secondary/40'}`}><td className="p-3 border-r text-center">{mapping.startRow === fIdx ? <span className="text-[9px] font-black text-primary">▶ INICIO</span> : fIdx + 1}</td>{fila.map((c: any, cIdx: number) => (<td key={cIdx} className={`p-3 text-xs border-r ${mapping.sku === cIdx ? 'text-blue-500' : mapping.desc === cIdx ? 'text-emerald-500' : mapping.precio === cIdx ? 'text-primary' : 'text-muted-foreground'}`}>{c}</td>))}</tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
                <div className="space-y-5">
                    <div className="bg-card border rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
                        <div>
                            <h2 className="text-xl font-black flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> {results.length} productos listos</h2>
                            {anomalyCount > 0 && <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1"><AlertTriangle className="h-3 w-3" /> {anomalyCount} anomalías</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={handleDownload} disabled={loading}><Download className="h-4 w-4 mr-2" /> Excel</Button>
                            <Button onClick={handleSaveCatalogo} disabled={loading || results.length === 0} variant="outline" className="border-violet-500/40 text-violet-600 hover:bg-violet-500/10"><DatabaseZap className="h-4 w-4 mr-2" /> Guardar Catálogo</Button>
                            <div className="h-8 border-l hidden lg:block mx-2" />
                            <button onClick={integraciones?.meli_access_token ? handleSyncMeLi : undefined} disabled={loading || !integraciones?.meli_access_token} className={`flex items-center px-4 py-2 rounded-xl font-bold text-sm ${integraciones?.meli_access_token ? 'bg-[#FFE600] text-[#2D3277]' : 'bg-secondary text-muted-foreground opacity-60'}`}>{loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Image src="/logos/meli.png" width={16} height={16} alt="meli" className="mr-2" />} {integraciones?.meli_access_token ? 'Actualizar MeLi' : 'MeLi (sin conectar)'}</button>
                            <button onClick={integraciones?.tiendanube_access_token ? handleSyncTiendaNube : undefined} disabled={loading || !integraciones?.tiendanube_access_token} className={`flex items-center px-4 py-2 rounded-xl font-bold text-sm ${integraciones?.tiendanube_access_token ? 'bg-[#0070F0] text-white' : 'bg-secondary text-muted-foreground opacity-60'}`}>{loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Image src="/logos/tiendanube.png" width={16} height={16} alt="tn" className="mr-2" />} {integraciones?.tiendanube_access_token ? 'Actualizar TN' : 'TN (sin conectar)'}</button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-card border rounded-2xl px-5 py-4">
                        <span className="text-[10px] font-black uppercase text-muted-foreground"><Filter className="h-3.5 w-3.5 inline mr-1" /> Filtrar:</span>
                        <label className="flex items-center gap-2 cursor-pointer"><Switch checked={filterMeli} onCheckedChange={setFilterMeli} className="scale-75" /><span className="text-xs font-bold text-amber-600">Mercado Libre</span></label>
                        <label className="flex items-center gap-2 cursor-pointer"><Switch checked={filterTN} onCheckedChange={setFilterTN} className="scale-75" /><span className="text-xs font-bold text-blue-600">Tienda Nube</span></label>
                        <span className="ml-auto text-xs font-bold text-muted-foreground">{processedResults.length} / {results.length}</span>
                    </div>

                    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
                        <div className="max-h-[560px] overflow-y-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-secondary/40 sticky top-0 shadow-sm border-b">
                                    <tr><th className="w-9 p-3"></th><th className="text-left p-3 text-[10px] font-black uppercase text-muted-foreground">Plataforma</th><th className="text-left p-3 text-[10px] font-black uppercase text-muted-foreground">SKU</th><th className="text-left p-3 text-[10px] font-black uppercase text-muted-foreground">Descripción</th><th className="text-right p-3 text-[10px] font-black uppercase text-muted-foreground">Costo</th><th className="text-right p-3 text-[10px] font-black uppercase text-primary">Precio Final ✏️</th></tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {processedResults.map((prod, i) => {
                                        const anomaly = isAnomaly(prod.precio_final ?? 0, prod.precio_original ?? 0)
                                        return (
                                            <tr key={i} className={anomaly ? 'bg-red-500/5' : 'hover:bg-secondary/20'}>
                                                <td className="p-3 text-center">{anomaly && <AlertTriangle className="h-3.5 w-3.5 text-red-500 mx-auto" />}</td>
                                                <td className="p-3"><PlatformBadges plataformas={prod.plataformas} /></td>
                                                <td className="p-3 font-mono font-bold text-xs">{prod.sku}</td>
                                                <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">{prod.descripcion}</td>
                                                <td className="p-3 text-right text-xs font-mono">${prod.precio_original?.toLocaleString('es-AR')}</td>
                                                <td className="p-3 pr-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {anomaly && <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${anomaly === 'bajo' ? 'text-red-500 bg-red-500/10' : 'text-orange-500 bg-orange-500/10'}`}>{anomaly}</span>}
                                                        <input type="number" value={prod.precio_final ?? ''} onChange={(e) => updatePrecioFinal(prod.sku, parseFloat(e.target.value))} className={`w-[100px] text-right font-black rounded-lg border bg-transparent py-1.5 px-2 ${anomaly ? 'border-red-500/40 text-red-500' : 'border-border'}`} />
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
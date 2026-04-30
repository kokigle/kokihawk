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
    ArrowLeft, LayoutGrid, LogOut, Save, CloudLightning
} from 'lucide-react'

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

                // MAGIA SILENCIOSA: Guardamos nuevos tokens si MeLi nos renovó la sesión
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

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <nav className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="bg-orange-600 p-1.5 rounded-lg"><LayoutGrid className="text-white h-5 w-5" /></div>
                    <span className="font-black text-xl tracking-tighter italic">KOKIHAWK <span className="text-orange-600">PRO</span></span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}>
                    <LogOut className="h-4 w-4" />
                </Button>
            </nav>

            <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-8">

                {step === 1 && (
                    <div className="max-w-2xl mx-auto text-center space-y-6 mt-10">
                        <h1 className="text-4xl font-black text-slate-800">Procesamiento de Listas</h1>
                        <Card className="border-2 border-dashed border-slate-300 bg-white hover:border-orange-500 transition-all cursor-pointer">
                            <CardContent className="p-20 text-center">
                                <input type="file" ref={fileInputRef} onChange={handlePreview} className="hidden" accept=".xlsx,.xls,.csv" />
                                <Button size="lg" onClick={() => fileInputRef.current?.click()} className="bg-orange-600 hover:bg-orange-700 text-lg h-14 px-10">
                                    {loading ? <Loader2 className="animate-spin" /> : "Elegir Archivo Excel"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border">
                            <div className="space-y-4 w-full md:w-auto">
                                <Button variant="ghost" size="sm" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
                                <div className="flex flex-wrap gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase text-blue-600">Usar Plantilla</Label>
                                        <select onChange={(e) => cargarPlantilla(e.target.value)} className="block w-full text-sm font-bold border-b-2 border-slate-200 p-1 bg-blue-50 outline-none rounded-md">
                                            <option value="">-- Seleccionar --</option>
                                            {plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase">Aumento %</Label>
                                        <Input type="number" value={aumento} onChange={(e) => setAumento(e.target.value)} className="h-8 w-24 font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase">Proveedor Especial</Label>
                                        <select value={proveedor} onChange={(e) => setProveedor(e.target.value)} className="block w-full text-sm font-bold border-b-2 border-slate-200 p-1 bg-white outline-none">
                                            <option value="generico">Mapeo Manual (Genérico)</option>
                                            <option value="pintarelli">Pintarelli (Auto Marcas)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={guardarPlantilla} disabled={mapping.sku === -1}><Save className="h-4 w-4 mr-2" /> Guardar Mapeo</Button>
                                <Button onClick={handleProcess} className="bg-orange-600 hover:bg-orange-700 font-black px-8">
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : "CALCULAR PRECIOS"}
                                </Button>
                            </div>
                        </div>

                        <Card className="shadow-xl bg-white border-none overflow-hidden">
                            <div className="bg-slate-800 text-white p-3 text-xs font-bold"><MousePointer2 className="inline h-4 w-4 mr-2" /> 1. Asigná las columnas. 2. Seleccioná la fila donde inician los datos.</div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-20 bg-slate-50"></TableHead>
                                            {previewData[0]?.map((_: any, idx: number) => (
                                                <TableHead key={idx} className="p-4 border-r bg-slate-50 min-w-[120px]">
                                                    <div className="flex flex-col gap-1.5">
                                                        <Button size="sm" variant={mapping.sku === idx ? "default" : "outline"} className={`h-7 text-[10px] font-bold ${mapping.sku === idx ? 'bg-blue-600 text-white border-blue-600' : ''}`} onClick={() => setMapping({ ...mapping, sku: idx })}>CÓDIGO</Button>
                                                        <Button size="sm" variant={mapping.desc === idx ? "default" : "outline"} className={`h-7 text-[10px] font-bold ${mapping.desc === idx ? 'bg-emerald-600 text-white border-emerald-600' : ''}`} onClick={() => setMapping({ ...mapping, desc: idx })}>DESCRIPCIÓN</Button>
                                                        <Button size="sm" variant={mapping.precio === idx ? "default" : "outline"} className={`h-7 text-[10px] font-bold ${mapping.precio === idx ? 'bg-orange-600 text-white border-orange-600' : ''}`} onClick={() => setMapping({ ...mapping, precio: idx })}>PRECIO</Button>
                                                    </div>
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.map((fila, fIdx) => (
                                            <TableRow key={fIdx} className={`cursor-pointer ${mapping.startRow === fIdx ? "bg-orange-50 border-y-2 border-orange-200" : "hover:bg-slate-50"}`} onClick={() => setMapping({ ...mapping, startRow: fIdx })}>
                                                <TableCell className="text-[10px] font-black border-r text-center text-slate-400">
                                                    {mapping.startRow === fIdx ? <span className="text-orange-600">INICIO</span> : fIdx + 1}
                                                </TableCell>
                                                {fila.map((celda: any, cIdx: number) => <TableCell key={cIdx} className="text-xs border-r text-slate-600">{celda}</TableCell>)}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <Card className="border-none shadow-2xl p-6 bg-white flex flex-col lg:flex-row justify-between items-center gap-6">
                            <div>
                                <CardTitle className="text-2xl font-black italic text-slate-800">LISTA LISTA PARA SINCRONIZAR</CardTitle>
                                <CardDescription>Revisá los {results.length} precios antes de enviarlos a las plataformas.</CardDescription>
                            </div>

                            <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto justify-end">
                                <Button variant="outline" onClick={handleDownload} className="border-slate-300 font-bold">
                                    {loading ? <Loader2 className="animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Bajar Excel
                                </Button>

                                <div className="h-10 border-l border-slate-200 mx-1 hidden lg:block"></div>

                                <Button
                                    onClick={handleSyncMeLi}
                                    disabled={loading}
                                    className={`font-black ${integraciones?.meli_access_token ? 'bg-[#FFE600] text-[#2D3277] hover:bg-[#FFE600]/80' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M7 8h10v2H7zm0 4h10v2H7zm-3-8h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>}
                                    {integraciones?.meli_access_token ? 'Actualizar M.Libre' : 'Conectar M.Libre'}
                                </Button>

                                <Button
                                    onClick={handleSyncTiendaNube}
                                    disabled={loading}
                                    className={`font-black ${integraciones?.tiendanube_access_token ? 'bg-[#0070F0] text-white hover:bg-[#0070F0]/80' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <CloudLightning className="mr-2 h-5 w-5" />}
                                    {integraciones?.tiendanube_access_token ? 'Actualizar Tiendanube' : 'Conectar Tiendanube'}
                                </Button>
                            </div>
                        </Card>

                        <Card className="border-none shadow-xl overflow-hidden">
                            <div className="max-h-[500px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                        <TableRow>
                                            <TableHead className="font-black text-[10px] uppercase text-slate-500 w-32">Marca</TableHead>
                                            <TableHead className="font-black text-[10px] uppercase text-slate-500">SKU</TableHead>
                                            <TableHead className="font-black text-[10px] uppercase text-slate-500">Descripción</TableHead>
                                            <TableHead className="text-right font-black text-[10px] uppercase text-slate-500">Costo Base</TableHead>
                                            <TableHead className="text-right font-black text-[10px] uppercase text-orange-600">Precio Final</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {results.map((prod, i) => (
                                            <TableRow key={i} className="hover:bg-slate-50 border-b border-slate-100">
                                                <TableCell className="p-3"><span className="text-[9px] font-black bg-slate-200 px-2 py-1 rounded text-slate-600 uppercase">{prod.marca || "Gral"}</span></TableCell>
                                                <TableCell className="font-mono font-bold text-slate-800 text-xs">{prod.sku}</TableCell>
                                                <TableCell className="text-xs text-slate-600">{prod.descripcion}</TableCell>
                                                <TableCell className="text-right text-slate-400 text-xs">${prod.precio_original.toLocaleString('es-AR')}</TableCell>
                                                <TableCell className="text-right font-black text-sm text-slate-900">${prod.precio_final.toLocaleString('es-AR')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    )
}
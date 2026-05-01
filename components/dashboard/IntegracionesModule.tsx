import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle, Upload, BookType, Trash2, Loader2 } from 'lucide-react'
import { IntegrationCard } from './SharedUI'

interface Props {
    integraciones: any;
    setActiveModule: (m: string) => void;
}

export default function IntegracionesModule({ integraciones, setActiveModule }: Props) {
    const [totalEquivalencias, setTotalEquivalencias] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    useEffect(() => {
        const loadData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
                // Buscamos cuántas equivalencias tiene guardadas el usuario
                const { count } = await supabase.from('diccionario_skus').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
                setTotalEquivalencias(count || 0)
            }
        }
        loadData()
    }, [supabase])

    const processDictionaryFile = async (file: File) => {
        if (!userId) return
        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            // 1. Python procesa el Excel y devuelve el JSON
            const res = await fetch('https://api.kokihawk.com.ar/leer-diccionario', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.status !== 'success') throw new Error(data.mensaje)

            // 2. Preparamos para Supabase
            const pares = data.diccionario.map((p: any) => ({
                user_id: userId,
                sku_proveedor: String(p.sku_proveedor).trim().toUpperCase(),
                sku_ecommerce: String(p.sku_ecommerce).trim().toUpperCase()
            }))

            // 3. Subimos en bloques por seguridad
            for (let i = 0; i < pares.length; i += 1000) {
                const chunk = pares.slice(i, i + 1000)
                const { error } = await supabase.from('diccionario_skus').upsert(chunk, { onConflict: 'user_id, sku_proveedor' })
                if (error) throw error
            }

            alert(`¡Diccionario guardado! Se actualizaron ${pares.length} equivalencias.`)
            setTotalEquivalencias(prev => prev + pares.length)
        } catch (err: any) {
            alert('Error al procesar el diccionario: ' + err.message)
        } finally {
            setLoading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
    const handleDragLeave = () => setIsDragging(false)
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) processDictionaryFile(file)
    }
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) processDictionaryFile(e.target.files[0])
    }

    const handleDeleteDictionary = async () => {
        if (!confirm('¿Seguro que querés borrar el diccionario? Esta acción no se puede deshacer.')) return
        if (!userId) return
        setLoading(true)
        try {
            await supabase.from('diccionario_skus').delete().eq('user_id', userId)
            setTotalEquivalencias(0)
            alert('Diccionario borrado exitosamente.')
        } catch {
            alert('Error al borrar el diccionario.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-xl mx-auto space-y-6 mt-6">
            <Button variant="ghost" size="sm" onClick={() => setActiveModule('hub')} className="text-muted-foreground hover:text-foreground gap-1.5 -ml-2">
                <ArrowLeft className="h-4 w-4" /> Volver al Hub
            </Button>
            <div className="space-y-2">
                <h1 className="text-2xl font-black text-foreground tracking-tight">Integraciones E-Commerce</h1>
                <p className="text-sm text-muted-foreground">Vinculá tus cuentas para sincronizar precios desde el Motor de Listas.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Plataformas</h3>
                <IntegrationCard logo="/logos/meli.png" name="Mercado Libre" connected={!!integraciones?.meli_access_token} onConnect={() => { const APP_ID = '3703622904525600'; window.location.href = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${APP_ID}&redirect_uri=https://api.kokihawk.com.ar/meli/callback` }} />
                <IntegrationCard logo="/logos/tiendanube.png" name="Tienda Nube" connected={!!integraciones?.tiendanube_access_token} onConnect={() => { window.location.href = 'https://www.tiendanube.com/apps/30786/authorize' }} />
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Diccionario de Equivalencias (SKUs)</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                            Subí un Excel con dos columnas <span className="font-semibold text-foreground">SKU Proveedor</span> y <span className="font-semibold text-foreground">SKU E-Commerce</span> para que KokiHawk traduzca tus códigos automáticamente antes de sincronizar.
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0"><BookType className="h-4 w-4 text-violet-500" /></div>
                </div>

                <div className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${totalEquivalencias > 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-secondary/40 border-border/60'}`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${totalEquivalencias > 0 ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                        <span className={`text-xs font-semibold ${totalEquivalencias > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                            {totalEquivalencias > 0 ? `Tenés ${totalEquivalencias.toLocaleString('es-AR')} equivalencias activas` : 'No hay equivalencias guardadas'}
                        </span>
                    </div>
                    {totalEquivalencias > 0 && (
                        <button onClick={handleDeleteDictionary} disabled={loading} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-red-500/70 hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-500/10">
                            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Borrar
                        </button>
                    )}
                </div>

                <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className={`relative flex items-center gap-4 rounded-xl border-2 border-dashed px-5 py-4 cursor-pointer transition-all duration-200 ${isDragging ? 'border-violet-500/60 bg-violet-500/5' : 'border-border hover:border-violet-400/50 hover:bg-violet-500/3'}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isDragging ? 'bg-violet-500/15' : 'bg-secondary'}`}>
                        <Upload className={`h-4 w-4 transition-colors ${isDragging ? 'text-violet-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground">{isDragging ? 'Soltá el archivo acá' : 'Arrastrá tu archivo o hacé clic'}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Formato <span className="font-mono font-bold">.xlsx</span> o <span className="font-mono font-bold">.csv</span></p>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
                </div>
            </div>

            <div className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-xl p-4">
                <AlertTriangle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">Al conectar una plataforma, autorizás a KokiHawk a actualizar los precios de tus publicaciones. Podés desvincular en cualquier momento desde la configuración de tu cuenta en cada plataforma.</p>
            </div>
        </div>
    )
}
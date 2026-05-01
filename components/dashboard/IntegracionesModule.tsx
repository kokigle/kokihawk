import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle, Upload, BookType, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
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
            const res = await fetch('https://api.kokihawk.com.ar/leer-diccionario', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.status !== 'success') throw new Error(data.mensaje)
            const pares = data.diccionario.map((p: any) => ({
                user_id: userId,
                sku_proveedor: String(p.sku_proveedor).trim().toUpperCase(),
                sku_ecommerce: String(p.sku_ecommerce).trim().toUpperCase()
            }))
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
        } catch { alert('Error al borrar el diccionario.') }
        finally { setLoading(false) }
    }

    return (
        <div className="max-w-lg mx-auto space-y-5 mt-4 md:mt-6">

            {/* Back */}
            <Button variant="ghost" size="sm" onClick={() => setActiveModule('hub')}
                className="text-muted-foreground hover:text-foreground gap-1.5 -ml-2 h-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Volver al Hub
            </Button>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight">Integraciones</h1>
                <p className="text-sm text-muted-foreground mt-1">Vinculá tus cuentas para sincronizar precios desde el Motor de Listas.</p>
            </div>

            {/* Platforms card */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 pt-4 pb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plataformas de venta</p>
                </div>
                <div className="px-4 pb-4 space-y-2.5">
                    <IntegrationCard
                        logo="/logos/meli.png"
                        name="Mercado Libre"
                        connected={!!integraciones?.meli_access_token}
                        onConnect={() => {
                            const APP_ID = '3703622904525600'
                            window.location.href = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${APP_ID}&redirect_uri=https://api.kokihawk.com.ar/meli/callback`
                        }}
                    />
                    <IntegrationCard
                        logo="/logos/tiendanube.png"
                        name="Tienda Nube"
                        connected={!!integraciones?.tiendanube_access_token}
                        onConnect={() => { window.location.href = 'https://www.tiendanube.com/apps/30786/authorize' }}
                    />
                </div>
            </div>

            {/* Dictionary card */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <BookType className="h-4 w-4 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-foreground">Diccionario de SKUs</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-xs">
                                Subí un Excel con <span className="font-semibold text-foreground">SKU Proveedor</span> y <span className="font-semibold text-foreground">SKU E-Commerce</span> para que KokiHawk traduzca tus códigos automáticamente.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status pill */}
                <div className="mx-4 mb-3">
                    <div className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${totalEquivalencias > 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-secondary/30 border-border/50'}`}>
                        <div className="flex items-center gap-2">
                            {totalEquivalencias > 0
                                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                : <div className="w-2 h-2 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                            }
                            <span className={`text-xs font-semibold ${totalEquivalencias > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                {totalEquivalencias > 0
                                    ? `${totalEquivalencias.toLocaleString('es-AR')} equivalencias activas`
                                    : 'Sin equivalencias guardadas'}
                            </span>
                        </div>
                        {totalEquivalencias > 0 && (
                            <button
                                onClick={handleDeleteDictionary}
                                disabled={loading}
                                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-500/60 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/8"
                            >
                                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                Borrar
                            </button>
                        )}
                    </div>
                </div>

                {/* Drop zone */}
                <div className="px-4 pb-4">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative flex items-center gap-4 rounded-xl border-2 border-dashed px-5 py-4 cursor-pointer transition-all duration-200 ${isDragging
                                ? 'border-violet-500/60 bg-violet-500/6 scale-[1.01]'
                                : 'border-border/50 hover:border-violet-400/50 hover:bg-violet-500/3'
                            }`}
                    >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isDragging ? 'bg-violet-500/15' : 'bg-secondary/60'}`}>
                            <Upload className={`h-4 w-4 transition-colors ${isDragging ? 'text-violet-400' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-foreground">{isDragging ? 'Soltá el archivo acá' : 'Arrastrá tu archivo o hacé clic'}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Formato <span className="font-mono font-bold">.xlsx</span> o <span className="font-mono font-bold">.csv</span></p>
                        </div>
                        {loading && (
                            <div className="ml-auto">
                                <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
                            </div>
                        )}
                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
                    </div>
                </div>
            </div>

            {/* Legal note */}
            <div className="flex items-start gap-3 bg-primary/4 border border-primary/12 rounded-xl p-4">
                <AlertTriangle className="h-4 w-4 text-primary/60 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Al conectar una plataforma, autorizás a KokiHawk a actualizar los precios de tus publicaciones. Podés desvincular en cualquier momento desde la configuración de tu cuenta en cada plataforma.
                </p>
            </div>
        </div>
    )
}
'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, AlertTriangle, Upload, BookType, Trash2, Loader2, CheckCircle2, Plus } from 'lucide-react'
import { IntegrationCard } from './SharedUI'
import Image from 'next/image'

interface Diccionario {
    id: string
    nombre_proveedor: string
    contenido: any[]
    created_at: string
}

interface Props {
    integraciones: any
    setActiveModule: (m: string) => void
}

export default function IntegracionesModule({ integraciones, setActiveModule }: Props) {
    const [diccionarios, setDiccionarios] = useState<Diccionario[]>([])
    const [loadingDics, setLoadingDics] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const [pendingNombre, setPendingNombre] = useState('')
    const [userId, setUserId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)
            const { data } = await supabase
                .from('diccionarios')
                .select('id, nombre_proveedor, created_at, contenido')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            setDiccionarios(data || [])
            setLoadingDics(false)
        }
        load()
    }, []) // eslint-disable-line

    const handleFileSelect = (file: File) => {
        setPendingFile(file)
        // sugerir nombre a partir del nombre del archivo
        const suggested = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
        setPendingNombre(suggested)
    }

    const handleUpload = async () => {
        if (!pendingFile || !pendingNombre.trim() || !userId) return
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', pendingFile)
            const res = await fetch('https://api.kokihawk.com.ar/leer-diccionario', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.status !== 'success') throw new Error(data.mensaje)

            const { data: inserted, error } = await supabase
                .from('diccionarios')
                .insert({
                    user_id: userId,
                    nombre_proveedor: pendingNombre.trim(),
                    contenido: data.diccionario,
                })
                .select()
                .single()

            if (error) throw error

            setDiccionarios(prev => [inserted, ...prev])
            setPendingFile(null)
            setPendingNombre('')
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (err: any) {
            alert('Error al guardar el diccionario: ' + err.message)
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Borrar este diccionario? La acción no se puede deshacer.')) return
        const { error } = await supabase.from('diccionarios').delete().eq('id', id)
        if (!error) setDiccionarios(prev => prev.filter(d => d.id !== id))
        else alert('Error al borrar.')
    }

    return (
        <div className="max-w-lg mx-auto space-y-5 mt-4 md:mt-6">
            <Button variant="ghost" size="sm" onClick={() => setActiveModule('hub')}
                className="text-muted-foreground hover:text-foreground gap-1.5 -ml-2 h-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Volver al Hub
            </Button>

            <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight">Integraciones</h1>
                <p className="text-sm text-muted-foreground mt-1">Vinculá tus cuentas y cargá diccionarios de SKUs.</p>
            </div>

            {/* Plataformas */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 pt-4 pb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plataformas de venta</p>
                </div>
                <div className="px-4 pb-4 space-y-2.5">
                    <IntegrationCard logo="/logos/meli.png" name="Mercado Libre"
                        connected={!!integraciones?.meli_access_token}
                        onConnect={() => { window.location.href = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=3703622904525600&redirect_uri=https://api.kokihawk.com.ar/meli/callback` }} />
                    <IntegrationCard logo="/logos/tiendanube.png" name="Tienda Nube"
                        connected={!!integraciones?.tiendanube_access_token}
                        onConnect={() => { window.location.href = 'https://www.tiendanube.com/apps/30786/authorize' }} />
                </div>
            </div>

            {/* Diccionarios de SKUs */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 pt-4 pb-3 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <BookType className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-foreground">Diccionarios de SKUs</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-xs">
                            Excel de 3 columnas: <span className="font-semibold text-foreground">SKU Proveedor</span> · <span className="font-semibold text-foreground">SKU TN</span> · <span className="font-semibold text-foreground">SKU MeLi</span>
                        </p>
                    </div>
                </div>

                {/* Drop zone + nombre */}
                <div className="px-4 pb-2 space-y-2">
                    {!pendingFile ? (
                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFileSelect(f) }}
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex items-center gap-4 rounded-xl border-2 border-dashed px-5 py-4 cursor-pointer transition-all ${isDragging ? 'border-violet-500/60 bg-violet-500/6' : 'border-border/50 hover:border-violet-400/50 hover:bg-violet-500/3'}`}
                        >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDragging ? 'bg-violet-500/15' : 'bg-secondary/60'}`}>
                                <Upload className={`h-4 w-4 ${isDragging ? 'text-violet-400' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-foreground">Arrastrá o hacé clic para subir</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Formato <span className="font-mono font-bold">.xlsx</span> o <span className="font-mono font-bold">.csv</span></p>
                            </div>
                            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv"
                                onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]) }} className="hidden" />
                        </div>
                    ) : (
                        <div className="space-y-2 p-3 rounded-xl bg-secondary/30 border border-border/50">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                                <span className="text-xs text-muted-foreground truncate flex-1">{pendingFile.name}</span>
                                <button onClick={() => { setPendingFile(null); setPendingNombre('') }}
                                    className="text-muted-foreground/50 hover:text-muted-foreground">
                                    <span className="text-sm">✕</span>
                                </button>
                            </div>
                            <Input
                                value={pendingNombre}
                                onChange={e => setPendingNombre(e.target.value)}
                                placeholder="Nombre del proveedor (ej: Proveedor ABC)"
                                className="h-8 text-xs bg-card border-border/60"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleUpload} disabled={uploading || !pendingNombre.trim()}
                                    className="flex-1 bg-violet-500 hover:bg-violet-600 text-white font-bold text-xs gap-1.5 h-8">
                                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                    Guardar diccionario
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Lista de diccionarios guardados */}
                <div className="px-4 pb-4">
                    {loadingDics ? (
                        <div className="flex items-center gap-2 py-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/40" />
                            <span className="text-xs text-muted-foreground/50">Cargando...</span>
                        </div>
                    ) : diccionarios.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground/50 py-1">Sin diccionarios guardados.</p>
                    ) : (
                        <div className="space-y-1.5">
                            {diccionarios.map(dic => (
                                <div key={dic.id}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border/40 bg-secondary/20">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate">{dic.nombre_proveedor}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {dic.contenido?.length ?? 0} equivalencias · {new Date(dic.created_at).toLocaleDateString('es-AR')}
                                        </p>
                                    </div>
                                    <button onClick={() => handleDelete(dic.id)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500/40 hover:text-red-500 hover:bg-red-500/8 transition-colors">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Legal */}
            <div className="flex items-start gap-3 bg-primary/4 border border-primary/12 rounded-xl p-4">
                <AlertTriangle className="h-4 w-4 text-primary/60 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Al conectar una plataforma, autorizás a KokiHawk a actualizar los precios de tus publicaciones.
                    Podés desvincular en cualquier momento desde la configuración de tu cuenta en cada plataforma.
                </p>
            </div>
        </div>
    )
}
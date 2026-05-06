'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, AlertTriangle, Upload, BookType, Trash2, Loader2, CheckCircle2, Plus, MessageCircle, Wrench, Globe, Zap } from 'lucide-react'
import { IntegrationCard } from './SharedUI'
import Image from 'next/image'
import { toast } from 'sonner'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from '@/components/ui/dialog'

const WHATSAPP_URL = 'https://wa.me/5491153695863?text=Hola!%20Necesito%20una%20implementación%20a%20medida%20para%20mi%20empresa.%20%C2%BFMe%20pueden%20ayudar%3F'

interface Diccionario {
    id: string
    nombre_proveedor: string
    contenido: any[]
    created_at: string
}

interface Props {
    integraciones: any
    setIntegraciones: (fn: (prev: any) => any) => void
    setActiveModule: (m: string) => void
}

export default function IntegracionesModule({ integraciones, setIntegraciones, setActiveModule }: Props) {
    const [diccionarios, setDiccionarios] = useState<Diccionario[]>([])
    const [loadingDics, setLoadingDics] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const [pendingNombre, setPendingNombre] = useState('')
    const [userId, setUserId] = useState<string | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = useMemo(() => createClient(), [])

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
    }, [])

    const handleFileSelect = (file: File) => {
        setPendingFile(file)
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
            toast.error('Error al guardar el diccionario: ' + err.message)
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('diccionarios').delete().eq('id', id)
        if (!error) {
            setDiccionarios(prev => prev.filter(d => d.id !== id))
            toast.success('Diccionario eliminado')
        } else {
            toast.error('Error al borrar.')
        }
        setDeleteTarget(null)
    }

    return (
        <div className="space-y-5 mt-4 md:mt-6">
            <Button variant="ghost" size="sm" onClick={() => setActiveModule('hub')}
                className="text-muted-foreground hover:text-foreground gap-1.5 -ml-2 h-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Volver al Hub
            </Button>

            <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight">Integraciones</h1>
                <p className="text-sm text-muted-foreground mt-1">Vinculá tus cuentas, cargá diccionarios de SKUs y conocé nuestros servicios a medida.</p>
            </div>

            {/* 3-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* LEFT: What is the dictionary + info */}
                <div className="space-y-5">
                    {/* What is dictionary card */}
                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-5 pt-4 pb-3 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center flex-shrink-0">
                                <BookType className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-foreground">¿Qué es el diccionario?</p>
                            </div>
                        </div>
                        <div className="px-5 pb-5 space-y-3">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                El diccionario es un archivo Excel que <strong className="text-foreground">traduce los nombres de tus productos</strong> entre plataformas. Sin él, KokiHawk no puede saber qué producto de tu lista corresponde a cuál en Mercado Libre o Tienda Nube.
                            </p>

                            <div className="bg-secondary/40 rounded-xl p-3 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Formato requerido (3 columnas)</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-card rounded-lg p-2 text-center border border-border/40">
                                        <p className="text-[9px] font-black text-primary">SKU</p>
                                        <p className="text-[8px] text-muted-foreground mt-0.5">Tu código interno</p>
                                    </div>
                                    <div className="bg-card rounded-lg p-2 text-center border border-border/40">
                                        <p className="text-[9px] font-black text-blue-600 dark:text-blue-400">SKU_TN</p>
                                        <p className="text-[8px] text-muted-foreground mt-0.5">ID en Tienda Nube</p>
                                    </div>
                                    <div className="bg-card rounded-lg p-2 text-center border border-border/40">
                                        <p className="text-[9px] font-black text-amber-600 dark:text-amber-400">SKU_MELI</p>
                                        <p className="text-[8px] text-muted-foreground mt-0.5">ID en Mercado Libre</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 bg-primary/5 border border-primary/15 rounded-xl p-3">
                                <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    Con el diccionario cargado, el Motor de Listas traduce automáticamente los SKUs al sincronizar precios.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Custom implementations card */}
                    <div className="bg-gradient-to-br from-emerald-500/5 via-card to-emerald-500/5 border border-emerald-500/20 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <Wrench className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-foreground">Implementaciones a medida</p>
                                    <p className="text-[10px] text-muted-foreground">Soluciones personalizadas</p>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Hacemos integraciones con <strong className="text-foreground">cualquier plataforma</strong>: ERPs, CRMs, sistemas de facturación, marketplaces y más. Cada empresa es distinta y adaptamos KokiHawk a tu flujo de trabajo.
                            </p>

                            <div className="space-y-2">
                                {[
                                    { icon: Globe, text: 'Nuevas plataformas de e-commerce' },
                                    { icon: BookType, text: 'Diccionarios con columnas personalizadas' },
                                    { icon: Zap, text: 'Automatizaciones específicas para tu negocio' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <item.icon className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                        <p className="text-xs text-muted-foreground">{item.text}</p>
                                    </div>
                                ))}
                            </div>

                            <a
                                href={WHATSAPP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                            >
                                <MessageCircle className="h-4 w-4" />
                                Escribinos por WhatsApp
                            </a>
                        </div>
                    </div>
                </div>

                {/* CENTER: Platforms + Dictionary upload */}
                <div className="space-y-5">
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
                                <BookType className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-foreground">Diccionarios de SKUs</p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                    Subí tu Excel con las 3 columnas: SKU, SKU_TN, SKU_MELI
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
                                        <Upload className={`h-4 w-4 ${isDragging ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'}`} />
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
                                            <button onClick={() => setDeleteTarget(dic.id)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500/40 hover:text-red-500 hover:bg-red-500/8 transition-colors">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: More services + WhatsApp */}
                <div className="space-y-5">
                    {/* How it works card */}
                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-5 pt-4 pb-3 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
                                <Zap className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-foreground">¿Cómo funciona?</p>
                            </div>
                        </div>
                        <div className="px-5 pb-5 space-y-3">
                            {[
                                { n: '1', title: 'Conectá', desc: 'Vinculá MeLi y Tienda Nube' },
                                { n: '2', title: 'Cargá', desc: 'Subí tu diccionario de SKUs' },
                                { n: '3', title: 'Sincronizá', desc: 'Actualizá precios con un clic' },
                            ].map(s => (
                                <div key={s.n} className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0">{s.n}</span>
                                    <div>
                                        <p className="text-xs font-bold text-foreground">{s.title}</p>
                                        <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Need help card */}
                    <div className="bg-gradient-to-br from-primary/5 via-card to-blue-500/5 border border-primary/15 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                    <MessageCircle className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-foreground">¿Necesitás ayuda?</p>
                                    <p className="text-[10px] text-muted-foreground">Soporte personalizado</p>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Si tenés dudas sobre cómo configurar tu diccionario, conectar tus plataformas o necesitás una funcionalidad que no está disponible, <strong className="text-foreground">escribinos y te ayudamos</strong>.
                            </p>

                            <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-muted-foreground">Configuración inicial guiada</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-muted-foreground">Armado de diccionario a medida</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-muted-foreground">Integraciones con otros sistemas</p>
                                </div>
                            </div>

                            <a
                                href={WHATSAPP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                            >
                                <MessageCircle className="h-4 w-4" />
                                Contactar por WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm delete dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
                <DialogContent className="sm:max-w-md bg-card border-border/60">
                    <DialogHeader>
                        <DialogTitle className="text-foreground font-black flex items-center gap-2">
                            <Trash2 className="h-4 w-4 text-red-500" />
                            Eliminar diccionario
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            ¿Borrar este diccionario? La acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}
                            className="border-border/60 text-muted-foreground font-bold text-xs">Cancelar</Button>
                        <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}
                            className="bg-red-500 hover:bg-red-600 font-bold text-xs gap-1.5">
                            <Trash2 className="h-3.5 w-3.5" /> Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

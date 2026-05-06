import { useState, useEffect, useRef, useMemo, useDeferredValue, useCallback, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Search, DatabaseZap, Package2, ScanBarcode, X, Camera, Loader2, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { PlatformBadges } from './SharedUI'
import Image from 'next/image'

interface Props {
    userId: string
    setActiveModule: (m: string) => void
}

/* ─── Barcode Scanner Modal ─── */
function BarcodeScannerModal({ onDetected, onClose }: { onDetected: (code: string) => void; onClose: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const rafRef = useRef<number>(0)
    const [status, setStatus] = useState<'starting' | 'scanning' | 'unsupported' | 'error'>('starting')
    const [lastCode, setLastCode] = useState('')

    useEffect(() => {
        let detector: any = null

        const start = async () => {
            // Check BarcodeDetector support
            if (!('BarcodeDetector' in window)) {
                setStatus('unsupported')
                return
            }

            try {
                // @ts-ignore
                detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'itf', 'codabar'] })
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
                })
                streamRef.current = stream
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    await videoRef.current.play()
                    setStatus('scanning')
                    scan()
                }
            } catch {
                setStatus('error')
            }
        }

        const scan = () => {
            if (!videoRef.current || !detector) return
            detector.detect(videoRef.current).then((barcodes: any[]) => {
                if (barcodes.length > 0) {
                    const code = barcodes[0].rawValue
                    if (code !== lastCode) {
                        setLastCode(code)
                        // Brief visual feedback then close
                        setTimeout(() => {
                            onDetected(code)
                            onClose()
                        }, 300)
                    }
                }
                rafRef.current = requestAnimationFrame(scan)
            }).catch(() => {
                rafRef.current = requestAnimationFrame(scan)
            })
        }

        start()

        return () => {
            cancelAnimationFrame(rafRef.current)
            streamRef.current?.getTracks().forEach(t => t.stop())
        }
    }, []) // eslint-disable-line

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4" onClick={onClose}>
            <div className="relative w-full max-w-sm bg-card border border-border/60 rounded-3xl overflow-hidden shadow-2xl shadow-black/60" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <ScanBarcode className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-foreground">Escanear código</p>
                            <p className="text-[10px] text-muted-foreground">Apuntá la cámara al código de barras</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Camera view */}
                <div className="relative bg-black aspect-[4/3] overflow-hidden">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

                    {/* Scanning overlay */}
                    {status === 'scanning' && (
                        <>
                            {/* Corner brackets */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="relative w-48 h-40">
                                    {/* TL */}
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                                    {/* TR */}
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                                    {/* BL */}
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                                    {/* BR */}
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
                                    {/* Scan line */}
                                    <div className="absolute inset-x-2 h-px bg-primary/80 shadow-lg shadow-primary/50 animate-[scanline_2s_ease-in-out_infinite]" style={{ animation: 'scanline 2s ease-in-out infinite' }} />
                                </div>
                            </div>
                            {/* Status */}
                            <div className="absolute bottom-3 inset-x-0 flex justify-center">
                                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Buscando código...</span>
                                </div>
                            </div>
                        </>
                    )}

                    {status === 'starting' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                <p className="text-xs text-white/70">Iniciando cámara...</p>
                            </div>
                        </div>
                    )}

                    {status === 'unsupported' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
                            <div className="text-center space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                                    <Camera className="h-6 w-6 text-red-400" />
                                </div>
                                <p className="text-sm font-bold text-white">Navegador sin soporte</p>
                                <p className="text-xs text-white/50 leading-relaxed">Usá Chrome en Android o Safari en iOS para escanear códigos de barras.</p>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
                            <div className="text-center space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                                    <Camera className="h-6 w-6 text-red-400" />
                                </div>
                                <p className="text-sm font-bold text-white">Sin acceso a cámara</p>
                                <p className="text-xs text-white/50 leading-relaxed">Permitís el acceso a la cámara en tu navegador e intentá de nuevo.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer tip */}
                <div className="px-5 py-3 bg-secondary/20 border-t border-border/40">
                    <p className="text-[10px] text-muted-foreground text-center">Compatible con EAN-13, Code 128, UPC y más formatos.</p>
                </div>
            </div>

            {/* Scanline keyframe via inline style */}
            <style>{`
        @keyframes scanline {
          0% { top: 8px; opacity: 1; }
          50% { top: calc(100% - 8px); opacity: 0.6; }
          100% { top: 8px; opacity: 1; }
        }
      `}</style>
        </div>
    )
}

/* ─── Main CatalogoModule ─── */
export default function CatalogoModule({ userId, setActiveModule }: Props) {
    const [catalogo, setCatalogo] = useState<any[]>([])
    const [searchInput, setSearchInput] = useState('')
    const [filterMeliCat, setFilterMeliCat] = useState(false)
    const [filterTNCat, setFilterTNCat] = useState(false)
    const [loading, setLoading] = useState(true)
    const [showScanner, setShowScanner] = useState(false)
    const [, startTransition] = useTransition()
    const searchInputRef = useRef<HTMLInputElement>(null)
    const supabase = useMemo(() => createClient(), [])

    // useDeferredValue defers the expensive filter computation — keeps typing responsive
    const deferredSearch = useDeferredValue(searchInput)
    const deferredMeli = useDeferredValue(filterMeliCat)
    const deferredTN = useDeferredValue(filterTNCat)

    useEffect(() => {
        const loadCatalogo = async () => {
            setLoading(true)
            try {
                let allData: any[] = []
                let from = 0; let to = 999; let keepFetching = true
                while (keepFetching) {
                    const { data, error } = await supabase
                        .from('catalogo_precios')
                        .select('sku, descripcion, precio_final, precio_meli, precio_tn, sku_meli, sku_tn, proveedor, plataformas')
                        .eq('user_id', userId)
                        .order('sku', { ascending: true })
                        .range(from, to)
                    if (error) throw error
                    if (data && data.length > 0) { allData = [...allData, ...data]; from += 1000; to += 1000 }
                    else keepFetching = false
                }
                setCatalogo(allData)
            } catch (err) { console.error('Error al cargar el catálogo:', err) }
            finally { setLoading(false) }
        }
        loadCatalogo()
        setTimeout(() => searchInputRef.current?.focus(), 80)
    }, [userId]) // eslint-disable-line

    // Heavy filter runs on DEFERRED values — UI stays snappy
    const filteredCatalogo = useMemo(() => {
        let filtered = catalogo
        if (deferredMeli && !deferredTN) filtered = filtered.filter(p => p.plataformas?.includes('meli'))
        else if (deferredTN && !deferredMeli) filtered = filtered.filter(p => p.plataformas?.includes('tn'))
        else if (deferredMeli && deferredTN) filtered = filtered.filter(p => p.plataformas?.includes('meli') || p.plataformas?.includes('tn'))

        if (!deferredSearch.trim()) return filtered
        const q = deferredSearch.toLowerCase()
        return filtered.filter(p =>
            String(p.sku ?? '').toLowerCase().includes(q) ||
            String(p.sku_meli ?? '').toLowerCase().includes(q) ||
            String(p.sku_tn ?? '').toLowerCase().includes(q) ||
            String(p.descripcion ?? '').toLowerCase().includes(q)
        )
    }, [catalogo, deferredSearch, deferredMeli, deferredTN])

    const isFiltering = deferredSearch || deferredMeli || deferredTN
    const isPending = searchInput !== deferredSearch || filterMeliCat !== deferredMeli || filterTNCat !== deferredTN

    // ── Paginación del catálogo ──
    const CAT_PAGE_SIZE = 50
    const [catPage, setCatPage] = useState(1)
    useEffect(() => { setCatPage(1) }, [filteredCatalogo])
    const catTotalPages = Math.max(1, Math.ceil(filteredCatalogo.length / CAT_PAGE_SIZE))
    const paginatedCatalogo = useMemo(() => {
        const start = (catPage - 1) * CAT_PAGE_SIZE
        return filteredCatalogo.slice(start, start + CAT_PAGE_SIZE)
    }, [filteredCatalogo, catPage])

    const handleSearch = useCallback((val: string) => {
        setSearchInput(val)
    }, [])

    const handleBarcodeDetected = useCallback((code: string) => {
        startTransition(() => setSearchInput(code))
        setTimeout(() => searchInputRef.current?.focus(), 100)
    }, []) // eslint-disable-line

    const clearSearch = useCallback(() => {
        setSearchInput('')
        searchInputRef.current?.focus()
    }, [])

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)]">

            {/* Barcode scanner modal */}
            {showScanner && (
                <BarcodeScannerModal
                    onDetected={handleBarcodeDetected}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {/* Back */}
            <Button variant="ghost" size="sm" onClick={() => setActiveModule('hub')}
                className="text-muted-foreground hover:text-foreground gap-1.5 -ml-2 self-start mb-5 h-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Volver al Hub
            </Button>

            {/* ── Search row ── */}
            <div className="flex gap-2 mb-4">
                {/* Main search input */}
                <div className="relative flex-1">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none transition-colors ${isPending ? 'text-primary/60' : 'text-muted-foreground/40'}`} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchInput}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Buscá por código o descripción..."
                        className="w-full pl-12 pr-10 py-4 text-lg md:text-xl font-semibold bg-card border-2 border-border rounded-2xl outline-none transition-all duration-200 text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:shadow-lg focus:shadow-primary/8 caret-primary"
                        autoComplete="off"
                        spellCheck={false}
                    />
                    {/* Pending spinner or clear button */}
                    {isPending ? (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 text-primary/60 animate-spin" />
                        </div>
                    ) : searchInput ? (
                        <button
                            onClick={clearSearch}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all text-sm font-bold"
                        >×</button>
                    ) : null}
                </div>

                {/* Barcode scanner button */}
                <button
                    onClick={() => setShowScanner(true)}
                    className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 flex items-center justify-center transition-all duration-200 group"
                    title="Escanear código de barras"
                >
                    <ScanBarcode className="h-6 w-6 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                </button>
            </div>

            {/* ── Filters + count row ── */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                {/* MeLi filter */}
                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition-all ${filterMeliCat ? 'bg-amber-500/10 border-amber-500/30' : 'bg-card border-border/50 hover:border-amber-500/25'}`}>
                    <Switch checked={filterMeliCat} onCheckedChange={setFilterMeliCat} className="data-[state=checked]:bg-amber-500 scale-75" />
                    <div className="w-3.5 h-3.5 rounded-sm overflow-hidden bg-white border border-border/30 flex items-center justify-center">
                        <Image src="/logos/meli.png" alt="MeLi" width={14} height={14} className="object-contain w-3 h-3" />
                    </div>
                    <span className={`text-[11px] font-bold ${filterMeliCat ? 'text-amber-500' : 'text-muted-foreground'}`}>Mercado Libre</span>
                </label>

                {/* TN filter */}
                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition-all ${filterTNCat ? 'bg-blue-500/10 border-blue-500/30' : 'bg-card border-border/50 hover:border-blue-500/25'}`}>
                    <Switch checked={filterTNCat} onCheckedChange={setFilterTNCat} className="data-[state=checked]:bg-blue-500 scale-75" />
                    <div className="w-3.5 h-3.5 rounded-sm overflow-hidden bg-white border border-border/30 flex items-center justify-center">
                        <Image src="/logos/tiendanube.png" alt="TN" width={14} height={14} className="object-contain w-3 h-3" />
                    </div>
                    <span className={`text-[11px] font-bold ${filterMeliCat ? 'text-amber-500' : 'text-muted-foreground'}`}>Mercado Libre</span>
                </label>

                {/* TN filter */}
                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition-all ${filterTNCat ? 'bg-blue-500/10 border-blue-500/30' : 'bg-card border-border/50 hover:border-blue-500/25'}`}>
                    <Switch checked={filterTNCat} onCheckedChange={setFilterTNCat} className="data-[state=checked]:bg-blue-500 scale-75" />
                    <div className="w-3.5 h-3.5 rounded-sm overflow-hidden bg-white border border-border/30 flex items-center justify-center">
                        <Image src="/logos/tiendanube.png" alt="TN" width={14} height={14} className="object-contain w-3 h-3" />
                    </div>
                    <span className={`text-[11px] font-bold ${filterTNCat ? 'text-blue-500' : 'text-muted-foreground'}`}>Tienda Nube</span>
                </label>

                {/* Scan hint if search came from barcode */}
                {searchInput && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/15">
                        <Zap className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-bold text-primary/80 font-mono">{searchInput}</span>
                    </div>
                )}

                {/* Result count */}
                <div className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {loading ? (
                        <span className="inline-flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
                            Cargando catálogo...
                        </span>
                    ) : isFiltering ? (
                        <><span className="font-black text-foreground">{filteredCatalogo.length}</span> resultado{filteredCatalogo.length !== 1 ? 's' : ''}</>
                    ) : (
                        <><span className="font-black text-foreground">{catalogo.length}</span> productos</>
                    )}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="flex-1 bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm min-h-0">
                <div className="h-full overflow-auto">
                    <table className="w-full border-collapse min-w-[500px]">
                        <thead className="bg-secondary/50 sticky top-0 z-10 border-b border-border/60">
                            <tr>
                                <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-36">SKU Prov.</th>
                                <th className="text-left px-3 py-3.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 w-28">Proveedor</th>
                                <th className="text-center px-3 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-20">Tiendas</th>
                                <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción</th>
                                <th className="text-right px-3 py-3.5 text-[10px] font-black uppercase tracking-widest text-primary w-24"><span className="inline-flex items-center gap-1"><Image src="/logos/icon.png" alt="KH" width={12} height={12} className="rounded-sm w-3 h-3" /> Venta</span></th>
                                <th className="text-right px-3 py-3.5 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 w-24"><span className="inline-flex items-center gap-1"><Image src="/logos/meli.png" alt="ML" width={12} height={12} className="rounded-sm w-3 h-3" /> MeLi</span></th>
                                <th className="text-right px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 w-24"><span className="inline-flex items-center gap-1"><Image src="/logos/tiendanube.png" alt="TN" width={12} height={12} className="rounded-sm w-3 h-3" /> TN</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-5 py-3.5"><div className="h-4 w-24 bg-muted/60 rounded-md" /></td>
                                        <td className="px-4 py-3.5 text-center"><div className="h-5 w-12 bg-muted/60 rounded-md mx-auto" /></td>
                                        <td className="px-5 py-3.5"><div className="h-4 bg-muted/60 rounded-md" style={{ width: `${45 + (i * 17) % 40}%` }} /></td>
                                        <td className="px-5 py-3.5 text-right"><div className="h-6 w-28 bg-muted/60 rounded-md ml-auto" /></td>
                                    </tr>
                                ))
                            ) : filteredCatalogo.length > 0 ? (
                                paginatedCatalogo.map((prod, i) => (
                                    <tr
                                        key={prod.sku ?? i}
                                        className={`transition-colors group ${isPending ? 'opacity-60' : 'hover:bg-secondary/20'}`}
                                    >
                                        <td className="px-5 py-3">
                                            <span className="font-mono text-sm font-bold text-foreground tracking-wide">{prod.sku}</span>
                                            {(prod.sku_meli || prod.sku_tn) && (
                                                <div className="flex gap-2 mt-0.5">
                                                    {prod.sku_meli && <span className="text-[9px] font-mono text-amber-700 dark:text-amber-400/60">ML: {prod.sku_meli}</span>}
                                                    {prod.sku_tn && <span className="text-[9px] font-mono text-blue-700 dark:text-blue-400/60">TN: {prod.sku_tn}</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400/80">{prod.proveedor ?? 'General'}</span>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <PlatformBadges plataformas={prod.plataformas} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-foreground/75 leading-snug line-clamp-1">{prod.descripcion}</span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-base font-black text-foreground tabular-nums tracking-tight">
                                                ${prod.precio_final?.toLocaleString('es-AR') ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-base font-bold text-amber-600 dark:text-amber-300 tabular-nums tracking-tight">
                                                {prod.precio_meli != null ? `$${prod.precio_meli.toLocaleString('es-AR')}` : <span className="text-muted-foreground/30 text-sm">—</span>}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-base font-bold text-blue-600 dark:text-blue-300 tabular-nums tracking-tight">
                                                {prod.precio_tn != null ? `$${prod.precio_tn.toLocaleString('es-AR')}` : <span className="text-muted-foreground/30 text-sm">—</span>}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
                                            {catalogo.length === 0 ? (
                                                <>
                                                    <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                                        <DatabaseZap className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                                                    </div>
                                                    <div className="space-y-1.5 max-w-xs">
                                                        <p className="font-black text-foreground text-lg">Catálogo vacío</p>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                            Procesá una lista desde el <strong className="text-foreground">Motor de Listas</strong> y guardá el catálogo para consultarlo acá.
                                                        </p>
                                                    </div>
                                                    <Button variant="outline" size="sm" onClick={() => setActiveModule('motor')} className="gap-1.5 text-xs font-bold mt-1">
                                                        <Package2 className="h-3.5 w-3.5" /> Ir al Motor de Listas
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-14 h-14 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-center">
                                                        <Search className="h-6 w-6 text-muted-foreground/40" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-foreground">Sin resultados</p>
                                                        <p className="text-sm text-muted-foreground">Probá con otro término o quitá los filtros.</p>
                                                    </div>
                                                    {searchInput && (
                                                        <Button variant="ghost" size="sm" onClick={clearSearch} className="text-xs font-bold gap-1.5 text-muted-foreground">
                                                            <X className="h-3 w-3" /> Limpiar búsqueda
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Paginación */}
                {catTotalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/40 bg-secondary/20">
                        <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                            {((catPage - 1) * CAT_PAGE_SIZE + 1)}–{Math.min(catPage * CAT_PAGE_SIZE, filteredCatalogo.length)} de {filteredCatalogo.length}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setCatPage(p => Math.max(1, p - 1))} disabled={catPage === 1}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/60 text-[10px] font-bold text-muted-foreground hover:bg-secondary/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                <ChevronLeft className="h-3 w-3" /> Anterior
                            </button>
                            <span className="text-[10px] font-black text-foreground bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-lg tabular-nums">
                                {catPage} / {catTotalPages}
                            </span>
                            <button onClick={() => setCatPage(p => Math.min(catTotalPages, p + 1))} disabled={catPage === catTotalPages}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/60 text-[10px] font-bold text-muted-foreground hover:bg-secondary/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                Siguiente <ChevronRight className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
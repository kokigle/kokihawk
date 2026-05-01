import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Search, DatabaseZap } from 'lucide-react'
import { PlatformBadges } from './SharedUI'
import Image from 'next/image'

interface Props {
    userId: string;
    setActiveModule: (m: string) => void;
}

export default function CatalogoModule({ userId, setActiveModule }: Props) {
    const [catalogo, setCatalogo] = useState<any[]>([])
    const [searchCatalogo, setSearchCatalogo] = useState('')
    const searchInputRef = useRef<HTMLInputElement>(null)
    const [filterMeliCat, setFilterMeliCat] = useState(false)
    const [filterTNCat, setFilterTNCat] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const loadCatalogo = async () => {
            try {
                let allData: any[] = []
                let from = 0
                let to = 999
                let keepFetching = true
                while (keepFetching) {
                    const { data, error } = await supabase.from('catalogo_precios').select('*').eq('user_id', userId).order('sku', { ascending: true }).range(from, to)
                    if (error) throw error
                    if (data && data.length > 0) {
                        allData = [...allData, ...data]
                        from += 1000
                        to += 1000
                    } else { keepFetching = false }
                }
                setCatalogo(allData)
            } catch (err) { console.error("Error al cargar el catálogo:", err) }
        }
        loadCatalogo()
        setTimeout(() => searchInputRef.current?.focus(), 80)
    }, [userId, supabase])

    const filteredCatalogo = useMemo(() => {
        let filtered = catalogo
        if (filterMeliCat && !filterTNCat) filtered = filtered.filter(p => p.plataformas?.includes('meli'))
        else if (filterTNCat && !filterMeliCat) filtered = filtered.filter(p => p.plataformas?.includes('tn'))
        else if (filterMeliCat && filterTNCat) filtered = filtered.filter(p => p.plataformas?.includes('meli') || p.plataformas?.includes('tn'))

        if (!searchCatalogo.trim()) return filtered
        const q = searchCatalogo.toLowerCase()
        return filtered.filter(p => String(p.sku ?? '').toLowerCase().includes(q) || String(p.descripcion ?? '').toLowerCase().includes(q))
    }, [catalogo, searchCatalogo, filterMeliCat, filterTNCat])

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)]">
            <Button variant="ghost" size="sm" onClick={() => setActiveModule('hub')} className="text-muted-foreground hover:text-foreground gap-1.5 -ml-2 self-start mb-6">
                <ArrowLeft className="h-4 w-4" /> Volver al Hub
            </Button>
            <div className="relative mb-6">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/50 pointer-events-none" />
                <input ref={searchInputRef} type="text" value={searchCatalogo} onChange={e => setSearchCatalogo(e.target.value)} placeholder="Buscar por código o descripción..." className="w-full pl-14 pr-6 py-5 text-xl md:text-2xl font-semibold bg-card border-2 border-border rounded-2xl outline-none transition-all duration-200 text-foreground placeholder:text-muted-foreground/40 focus:border-primary/60 focus:shadow-lg focus:shadow-primary/10 caret-primary" autoComplete="off" spellCheck={false} />
                {searchCatalogo && <button onClick={() => { setSearchCatalogo(''); searchInputRef.current?.focus() }} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors text-lg font-bold">×</button>}
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${filterMeliCat ? 'bg-amber-500/10 border-amber-500/30' : 'bg-card border-border/60 hover:border-amber-400/40'}`}>
                    <Switch checked={filterMeliCat} onCheckedChange={setFilterMeliCat} className="data-[state=checked]:bg-amber-500 scale-75" />
                    <div className="w-3.5 h-3.5 rounded-sm overflow-hidden bg-white border border-border/30 flex items-center justify-center"><Image src="/logos/meli.png" alt="MeLi" width={10} height={10} className="object-contain" /></div>
                    <span className={`text-[11px] font-bold select-none ${filterMeliCat ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>Mercado Libre</span>
                </label>
                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${filterTNCat ? 'bg-blue-500/10 border-blue-500/30' : 'bg-card border-border/60 hover:border-blue-400/40'}`}>
                    <Switch checked={filterTNCat} onCheckedChange={setFilterTNCat} className="data-[state=checked]:bg-blue-500 scale-75" />
                    <div className="w-3.5 h-3.5 rounded-sm overflow-hidden bg-white border border-border/30 flex items-center justify-center"><Image src="/logos/tiendanube.png" alt="TN" width={10} height={10} className="object-contain" /></div>
                    <span className={`text-[11px] font-bold select-none ${filterTNCat ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>Tienda Nube</span>
                </label>
            </div>
            <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-xs text-muted-foreground">
                    {searchCatalogo || filterMeliCat || filterTNCat ? <><span className="font-black text-foreground">{filteredCatalogo.length}</span> resultados</> : <><span className="font-black text-foreground">{catalogo.length}</span> productos en el catálogo</>}
                </span>
            </div>
            <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm min-h-0">
                <div className="h-full overflow-y-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-secondary/40 sticky top-0 z-10 shadow-sm">
                            <tr className="border-b border-border">
                                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-36">Código / SKU</th>
                                <th className="text-center px-4 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-24">Tiendas</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción</th>
                                <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-primary w-52">Precio de Venta</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {filteredCatalogo.length > 0 ? (
                                filteredCatalogo.map((prod, i) => (
                                    <tr key={prod.sku ?? i} className="hover:bg-secondary/20 transition-colors group">
                                        <td className="px-6 py-4"><span className="font-mono text-sm font-bold text-foreground tracking-wide">{prod.sku}</span></td>
                                        <td className="px-4 py-4 text-center"><PlatformBadges plataformas={prod.plataformas} /></td>
                                        <td className="px-6 py-4"><span className="text-sm text-foreground/80 leading-snug">{prod.descripcion}</span></td>
                                        <td className="px-6 py-4 text-right"><span className="text-2xl font-black text-foreground tabular-nums tracking-tight">${prod.precio_final?.toLocaleString('es-AR') ?? '—'}</span></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4}>
                                        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
                                            {catalogo.length === 0 ? (
                                                <><div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center"><DatabaseZap className="h-7 w-7 text-violet-400" /></div><div className="space-y-1.5 max-w-xs"><p className="font-black text-foreground text-lg">Catálogo vacío</p><p className="text-sm text-muted-foreground leading-relaxed">Guardá una lista desde el <strong>Motor de Listas</strong>.</p></div></>
                                            ) : (
                                                <><div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center"><Search className="h-6 w-6 text-muted-foreground/40" /></div><p className="font-bold text-foreground">Sin resultados</p></>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
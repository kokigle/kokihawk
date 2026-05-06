'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import {
    ArrowLeft, History, CheckCircle2, XCircle, AlertTriangle,
    FileSpreadsheet, RefreshCw, Loader2, Clock, ChevronDown,
    ChevronUp, Search, X, Filter, Undo2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { useSyncJobs } from '@/contexts/SyncJobsContext'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────
interface HistorialRecord {
    id: string
    user_id: string
    plataforma: 'meli' | 'tn'
    nombre_archivo: string
    total_productos: number
    actualizados: number
    no_encontrados: number
    errores: number
    estado: 'success' | 'error'
    mensaje: string | null
    created_at: string
    snapshot_url?: string | null
}

interface Props {
    userId: string
    setActiveModule: (m: string) => void
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHrs = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'Hace un momento'
    if (diffMin < 60) return `Hace ${diffMin} min`
    if (diffHrs < 24) return `Hace ${diffHrs}h`
    if (diffDays < 7) return `Hace ${diffDays}d`

    return date.toLocaleDateString('es-AR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function formatDateFull(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-AR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
}

// ─────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────
function StatusBadge({ estado, errores, noEncontrados }: {
    estado: string
    errores: number
    noEncontrados: number
}) {
    if (estado === 'error') {
        return (
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/25 rounded-lg px-2.5 py-1">
                <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider text-red-500">Error</span>
            </div>
        )
    }
    if (errores > 0) {
        return (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2.5 py-1">
                <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">Parcial</span>
            </div>
        )
    }
    if (noEncontrados > 0) {
        return (
            <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/25 rounded-lg px-2.5 py-1">
                <AlertTriangle className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Parcial</span>
            </div>
        )
    }
    return (
        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-2.5 py-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">OK</span>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// PLATFORM BADGE
// ─────────────────────────────────────────────────────────────────
function PlatformBadge({ plataforma }: { plataforma: 'meli' | 'tn' }) {
    const isMeli = plataforma === 'meli'
    return (
        <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 border ${isMeli
            ? 'bg-amber-500/8 border-amber-500/20'
            : 'bg-blue-500/8 border-blue-500/20'
            }`}>
            <div className="w-4 h-4 rounded-sm overflow-hidden bg-white flex items-center justify-center flex-shrink-0 border border-border/15">
                <Image
                    src={isMeli ? '/logos/meli.png' : '/logos/tiendanube.png'}
                    alt={isMeli ? 'MeLi' : 'TN'}
                    width={16} height={16}
                    className="object-contain w-3.5 h-3.5"
                />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wide ${isMeli ? 'text-amber-600 dark:text-amber-500' : 'text-blue-600 dark:text-blue-500'}`}>
                {isMeli ? 'MeLi' : 'TN'}
            </span>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// EXPANDABLE ROW DETAIL
// ─────────────────────────────────────────────────────────────────
function ExpandedDetail({ record }: { record: HistorialRecord }) {
    return (
        <div className="bg-secondary/20 border-t border-border/30 px-5 py-4 space-y-3 animate-in slide-in-from-top-1 duration-200">
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total', value: record.total_productos, color: 'text-foreground', bg: 'bg-secondary/50' },
                    { label: 'Actualizados', value: record.actualizados, color: 'text-emerald-500', bg: 'bg-emerald-500/8' },
                    { label: 'Sin match', value: record.no_encontrados, color: 'text-amber-500', bg: 'bg-amber-500/8' },
                    { label: 'Errores', value: record.errores, color: 'text-red-500', bg: 'bg-red-500/8' },
                ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-xl border border-border/30 px-3 py-2.5`}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                        <p className={`text-lg font-black tabular-nums ${stat.color}`}>{stat.value.toLocaleString('es-AR')}</p>
                    </div>
                ))}
            </div>

            {/* Timestamps + message */}
            <div className="flex flex-col sm:flex-row gap-3 text-[11px]">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span>{formatDateFull(record.created_at)}</span>
                </div>
                {record.mensaje && (
                    <div className="flex items-start gap-1.5 text-red-400 bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                        <span className="break-all">{record.mensaje}</span>
                    </div>
                )}
            </div>

            {/* Success rate bar */}
            {record.total_productos > 0 && (
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                        <span>Tasa de éxito</span>
                        <span className="tabular-nums">
                            {Math.round((record.actualizados / record.total_productos) * 100)}%
                        </span>
                    </div>
                    <div className="w-full h-2 bg-secondary/60 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                            style={{ width: `${Math.round((record.actualizados / record.total_productos) * 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Rollback — solo si hay snapshot disponible */}
            {record.snapshot_url && record.estado === 'success' && (
                <RollbackButton record={record} />
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// ROLLBACK BUTTON
// ─────────────────────────────────────────────────────────────────
function RollbackButton({ record }: { record: HistorialRecord }) {
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)
    const supabase = useMemo(() => createClient(), [])

    const handleRollback = async () => {
        if (!confirm(`¿Deshacer la sync de "${record.nombre_archivo}"? Se revertirán ${record.actualizados} precios al valor anterior.`)) return
        setLoading(true)
        try {
            // Get JWT for auth
            const { data: { session } } = await supabase.auth.getSession()
            const jwt = session?.access_token
            if (!jwt) { toast.error('Sesión expirada. Recargá la página.'); return }

            // Get integration tokens needed by the backend
            const { data: ints } = await supabase
                .from('integraciones_api')
                .select('*')
                .eq('user_id', record.user_id)
                .single()

            // Build payload matching backend expectation:
            // { snapshot_url, plataforma, token, refresh_token?, store_id? }
            const payload: Record<string, string> = {
                snapshot_url: record.snapshot_url!,
                plataforma: record.plataforma,
                token: record.plataforma === 'meli'
                    ? (ints?.meli_access_token ?? '')
                    : (ints?.tiendanube_access_token ?? ''),
            }
            if (record.plataforma === 'meli') {
                payload.refresh_token = ints?.meli_refresh_token ?? ''
            } else {
                payload.store_id = ints?.tiendanube_store_id ?? ''
            }

            const res = await fetch('https://api.kokihawk.com.ar/deshacer-sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`,
                },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (res.ok && data.status === 'queued') {
                toast.success(`✓ Rollback encolado — se revertirán ${record.actualizados} precios`)
                setDone(true)
            } else {
                toast.error('Error al deshacer: ' + (data.error ?? data.mensaje ?? 'Intentalo de nuevo'))
            }
        } catch {
            toast.error('Error de red al deshacer la sincronización')
        } finally {
            setLoading(false)
        }
    }

    if (done) return (
        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-500 mt-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Precios revertidos correctamente
        </div>
    )

    return (
        <button
            onClick={handleRollback}
            disabled={loading}
            className="mt-1 flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-black border border-amber-500/30 bg-amber-500/8 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 hover:border-amber-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading
                ? <><Loader2 className="h-3 w-3 animate-spin" /> Deshaciendo...</>
                : <><Undo2 className="h-3 w-3" /> Deshacer esta sync</>
            }
        </button>
    )
}

// ─────────────────────────────────────────────────────────────────
// HISTORIAL ROW
// ─────────────────────────────────────────────────────────────────
function HistorialRow({ record }: { record: HistorialRecord }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="border-b border-border/25 last:border-0">
            <button
                onClick={() => setExpanded(e => !e)}
                className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-secondary/20 transition-colors text-left group"
            >
                {/* Date (mobile: short, desktop: full) */}
                <div className="w-24 sm:w-32 flex-shrink-0">
                    <p className="text-xs font-bold text-foreground">{formatDate(record.created_at)}</p>
                </div>

                {/* Platform */}
                <div className="flex-shrink-0 hidden sm:block">
                    <PlatformBadge plataforma={record.plataforma} />
                </div>

                {/* File name */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0 hidden sm:block" />
                    <span className="text-xs text-muted-foreground truncate">
                        {record.nombre_archivo || 'manual'}
                    </span>
                </div>

                {/* Quick stats */}
                <div className="hidden md:flex items-center gap-3 text-[10px] font-bold tabular-nums flex-shrink-0">
                    <span className="text-emerald-500">✓{record.actualizados}</span>
                    {record.no_encontrados > 0 && (
                        <span className="text-amber-500">~{record.no_encontrados}</span>
                    )}
                    {record.errores > 0 && (
                        <span className="text-red-500">✗{record.errores}</span>
                    )}
                </div>

                {/* Status badge */}
                <StatusBadge estado={record.estado} errores={record.errores} noEncontrados={record.no_encontrados} />

                {/* Mobile platform indicator */}
                <div className="sm:hidden flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${record.plataforma === 'meli' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                </div>

                {/* Expand chevron */}
                <div className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground/30 group-hover:text-muted-foreground transition-colors flex-shrink-0">
                    {expanded
                        ? <ChevronUp className="h-3.5 w-3.5" />
                        : <ChevronDown className="h-3.5 w-3.5" />
                    }
                </div>
            </button>

            {expanded && <ExpandedDetail record={record} />}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-border/40 flex items-center justify-center mb-5">
                <History className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <h3 className="text-base font-black text-foreground mb-1.5">Sin sincronizaciones aún</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Cuando sincronices precios con MeLi o Tienda Nube, el historial aparecerá acá automáticamente.
            </p>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// SKELETON LOADER
// ─────────────────────────────────────────────────────────────────
function SkeletonRows() {
    return (
        <div className="divide-y divide-border/25">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-4">
                    <div className="w-28 h-4 bg-secondary/60 rounded animate-pulse" />
                    <div className="w-16 h-6 bg-secondary/60 rounded-lg animate-pulse hidden sm:block" />
                    <div className="flex-1 h-4 bg-secondary/40 rounded animate-pulse" />
                    <div className="w-16 h-6 bg-secondary/60 rounded-lg animate-pulse" />
                </div>
            ))}
        </div>
    )
}

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export default function HistoryModule({ userId, setActiveModule }: Props) {
    const [records, setRecords] = useState<HistorialRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterPlataforma, setFilterPlataforma] = useState<'all' | 'meli' | 'tn'>('all')
    const [filterEstado, setFilterEstado] = useState<'all' | 'success' | 'error'>('all')
    const { jobs } = useSyncJobs()

    const API = 'https://api.kokihawk.com.ar'
    const supabase = useMemo(() => createClient(), [])

    const fetchHistorial = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true)
        else setRefreshing(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const jwt = session?.access_token
            const res = await fetch(`${API}/historial/${userId}?limit=100`, {
                headers: jwt ? { 'Authorization': `Bearer ${jwt}` } : {},
            })
            if (res.ok) {
                const data = await res.json()
                setRecords(data)
            }
        } catch (err) {
            console.error('Error fetching historial:', err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [userId])

    // Initial load
    useEffect(() => {
        if (userId) fetchHistorial()
    }, [userId, fetchHistorial])

    // Auto-refresh when an active job finishes
    useEffect(() => {
        const hasActive = jobs.some(j => j.status === 'queued' || j.status === 'processing')
        const allDone = jobs.length > 0 && jobs.every(j => j.status === 'success' || j.status === 'error')
        if (!hasActive && allDone) {
            // Small delay to let backend insert historial
            const timer = setTimeout(() => fetchHistorial(false), 2000)
            return () => clearTimeout(timer)
        }
    }, [jobs, fetchHistorial])

    // ── Filtered records ──
    const filteredRecords = records.filter(r => {
        if (filterPlataforma !== 'all' && r.plataforma !== filterPlataforma) return false
        if (filterEstado !== 'all' && r.estado !== filterEstado) return false
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase()
            if (
                !r.nombre_archivo?.toLowerCase().includes(q) &&
                !r.plataforma.toLowerCase().includes(q) &&
                !r.estado.toLowerCase().includes(q)
            ) return false
        }
        return true
    })

    // ── Stats summary ──
    const totalSyncs = records.length
    const successSyncs = records.filter(r => r.estado === 'success').length
    const errorSyncs = records.filter(r => r.estado === 'error').length
    const totalUpdated = records.reduce((sum, r) => sum + (r.actualizados || 0), 0)

    return (
        <div className="max-w-4xl mx-auto space-y-5 mt-4 md:mt-6">
            <Button variant="ghost" size="sm" onClick={() => setActiveModule('hub')}
                className="text-muted-foreground hover:text-foreground gap-1.5 -ml-2 h-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Volver al Hub
            </Button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <History className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-foreground tracking-tight">Historial</h1>
                            <p className="text-sm text-muted-foreground">Registro completo de sincronizaciones</p>
                        </div>
                    </div>
                </div>
                <Button
                    variant="outline" size="sm"
                    onClick={() => fetchHistorial(false)}
                    disabled={refreshing}
                    className="border-border/60 text-xs font-bold gap-1.5 self-start sm:self-auto"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            {/* Stats cards */}
            {!loading && records.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Sincronizaciones', value: totalSyncs, color: 'text-foreground', icon: <History className="h-3.5 w-3.5" /> },
                        { label: 'Exitosas', value: successSyncs, color: 'text-emerald-500', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
                        { label: 'Fallidas', value: errorSyncs, color: 'text-red-500', icon: <XCircle className="h-3.5 w-3.5" /> },
                        { label: 'Productos actualiz.', value: totalUpdated, color: 'text-primary', icon: <FileSpreadsheet className="h-3.5 w-3.5" /> },
                    ].map(stat => (
                        <div key={stat.label} className="bg-card border border-border/50 rounded-2xl px-4 py-3 space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className={`${stat.color} opacity-50`}>{stat.icon}</span>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                            </div>
                            <p className={`text-xl font-black tabular-nums ${stat.color}`}>
                                {stat.value.toLocaleString('es-AR')}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters bar */}
            {!loading && records.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 bg-card border border-border/60 rounded-2xl px-4 py-3 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 flex-shrink-0">
                        <Filter className="h-3 w-3" /> Filtrar:
                    </span>

                    {/* Platform filter */}
                    {(['all', 'meli', 'tn'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setFilterPlataforma(p)}
                            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-all ${filterPlataforma === p
                                ? 'bg-primary/10 border-primary/30 text-primary'
                                : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
                                }`}
                        >
                            {p === 'all' ? 'Todas' : p === 'meli' ? 'MeLi' : 'TN'}
                        </button>
                    ))}

                    <div className="w-px h-5 bg-border/40 mx-1 hidden sm:block" />

                    {/* Status filter */}
                    {(['all', 'success', 'error'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterEstado(s)}
                            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-all ${filterEstado === s
                                ? s === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                    : s === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500'
                                        : 'bg-primary/10 border-primary/30 text-primary'
                                : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
                                }`}
                        >
                            {s === 'all' ? 'Todos' : s === 'success' ? 'OK' : 'Error'}
                        </button>
                    ))}

                    {/* Search */}
                    <div className="relative ml-auto flex-1 min-w-[160px] max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Buscar archivo..."
                            className="h-8 pl-8 pr-8 text-xs font-medium bg-secondary/40 border-border/60 focus:border-primary/50 placeholder:text-muted-foreground/40"
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

                    <span className="text-xs font-bold tabular-nums text-muted-foreground flex-shrink-0">
                        {filteredRecords.length} / {records.length}
                    </span>
                </div>
            )}

            {/* Table */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {/* Table header */}
                <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-border/50 bg-secondary/30">
                    <span className="w-24 sm:w-32 text-[9px] font-black uppercase tracking-widest text-muted-foreground flex-shrink-0">Fecha</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex-shrink-0 hidden sm:block w-16">Plat.</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex-1">Archivo</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex-shrink-0 hidden md:block w-24">Resultado</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex-shrink-0 w-16 text-right">Estado</span>
                    <span className="w-5 flex-shrink-0" />
                </div>

                {/* Content */}
                {loading ? (
                    <SkeletonRows />
                ) : filteredRecords.length === 0 ? (
                    records.length === 0 ? <EmptyState /> : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Search className="h-6 w-6 text-muted-foreground/20 mb-3" />
                            <p className="text-sm font-bold text-muted-foreground">Sin resultados</p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">Probá cambiando los filtros</p>
                        </div>
                    )
                ) : (
                    <div className="divide-y divide-border/15">
                        {filteredRecords.map(record => (
                            <HistorialRow key={record.id} record={record} />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer info */}
            <div className="flex items-start gap-2.5 bg-secondary/20 border border-border/40 rounded-xl p-4">
                <History className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground/60 leading-relaxed">
                    El historial se actualiza automáticamente al finalizar cada sincronización.
                    Los registros se conservan indefinidamente para auditoría.
                </p>
            </div>
        </div>
    )
}

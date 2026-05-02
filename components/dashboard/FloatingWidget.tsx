'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { CheckCircle2, XCircle, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useSyncJobs, JobStatus } from '@/contexts/SyncJobsContext'
import { useState } from 'react'

const API = 'https://api.kokihawk.com.ar'

function ProgressBar({ value, total }: { value: number; total: number }) {
    const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0
    return (
        <div className="w-full bg-secondary/60 rounded-full h-1.5 overflow-hidden">
            <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
            />
        </div>
    )
}

function JobRow({ job, onRemove }: { job: JobStatus; onRemove: () => void }) {
    const logo = job.plataforma === 'meli' ? '/logos/meli.png' : '/logos/tiendanube.png'
    const name = job.plataforma === 'meli' ? 'Mercado Libre' : 'Tienda Nube'
    const isDone = job.status === 'success' || job.status === 'error' || job.status === 'timeout'
    const pct = job.total ? Math.min(100, Math.round(((job.procesados ?? 0) / job.total) * 100)) : 0

    return (
        <div className="p-3 space-y-2">
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-sm overflow-hidden bg-white border border-border/20 flex items-center justify-center flex-shrink-0">
                    <Image src={logo} alt={name} width={14} height={14} className="object-contain" />
                </div>
                <span className="text-xs font-bold text-foreground flex-1">{name}</span>

                {job.status === 'processing' || job.status === 'queued' ? (
                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin flex-shrink-0" />
                ) : job.status === 'success' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                ) : job.status === 'error' || job.status === 'timeout' ? (
                    <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                ) : null}

                {isDone && (
                    <button onClick={onRemove}
                        className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary/60 transition-colors">
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>

            {job.status === 'processing' && (
                <>
                    <ProgressBar value={job.procesados ?? 0} total={job.total ?? 1} />
                    <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                        <span>{job.procesados ?? 0} / {job.total ?? '?'} ({pct}%)</span>
                        <span className="text-emerald-500 font-bold">✓ {job.actualizados ?? 0}</span>
                    </div>
                </>
            )}

            {job.status === 'queued' && (
                <p className="text-[10px] text-muted-foreground/60">En cola...</p>
            )}

            {job.status === 'success' && (
                <div className="flex gap-3 text-[10px] font-bold">
                    <span className="text-emerald-500">✓ {job.actualizados ?? 0} actualizados</span>
                    {(job.no_encontrados ?? 0) > 0 && (
                        <span className="text-amber-500">~ {job.no_encontrados} sin match</span>
                    )}
                    {(job.errores ?? 0) > 0 && (
                        <span className="text-red-500">✗ {job.errores} errores</span>
                    )}
                </div>
            )}

            {job.status === 'error' && (
                <p className="text-[10px] text-red-400">{job.mensaje ?? 'Error desconocido'}</p>
            )}

            {job.status === 'timeout' && (
                <p className="text-[10px] text-red-400">⏱ Sin señal del servidor — marcado como fallido</p>
            )}
        </div>
    )
}

export default function FloatingWidget({
    onTokensRefreshed,
}: {
    onTokensRefreshed?: (plataforma: 'meli', tokens: { access_token: string; refresh_token: string }) => void
}) {
    const { jobs, updateJob, removeJob } = useSyncJobs()
    const [minimized, setMinimized] = useState(false)
    const intervalRefs = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())

    const activeJobs = jobs.filter(j => j.status !== 'not_found')

    useEffect(() => {
        const pending = jobs.filter(j => j.status === 'queued' || j.status === 'processing')

        pending.forEach(job => {
            if (intervalRefs.current.has(job.job_id)) return  // ya tiene intervalo

            const iv = setInterval(async () => {
                try {
                    const res = await fetch(`${API}/jobs/${job.job_id}/status`)
                    if (!res.ok) return
                    const data = await res.json()

                    updateJob(job.job_id, {
                        status: data.status,
                        procesados: data.procesados,
                        total: data.total,
                        actualizados: data.actualizados,
                        no_encontrados: data.no_encontrados,
                        errores: data.errores,
                        mensaje: data.mensaje,
                        errores_detalle: data.errores_detalle,
                        last_heartbeat: data.last_heartbeat,
                    })

                    // Si el job terminó, limpiar intervalo
                    if (data.status === 'success' || data.status === 'error' || data.status === 'not_found') {
                        clearInterval(intervalRefs.current.get(job.job_id))
                        intervalRefs.current.delete(job.job_id)

                        // Propagar tokens renovados de MeLi
                        if (data.nuevos_tokens && job.plataforma === 'meli' && onTokensRefreshed) {
                            onTokensRefreshed('meli', data.nuevos_tokens)
                        }
                    }
                } catch { /* network hiccup, retry next tick */ }
            }, 2000)

            intervalRefs.current.set(job.job_id, iv)
        })

        // Limpiar intervalos de jobs ya no presentes
        intervalRefs.current.forEach((iv, id) => {
            if (!jobs.find(j => j.job_id === id)) {
                clearInterval(iv)
                intervalRefs.current.delete(id)
            }
        })

        // Cleanup: matar todos los intervalos al re-ejecutar el efecto
        return () => {
            intervalRefs.current.forEach(iv => clearInterval(iv))
            intervalRefs.current.clear()
        }
    }, [jobs, updateJob, onTokensRefreshed])

    // Limpiar todo al desmontar
    useEffect(() => {
        return () => {
            intervalRefs.current.forEach(iv => clearInterval(iv))
        }
    }, [])

    if (activeJobs.length === 0) return null

    const hasActive = activeJobs.some(j => j.status === 'queued' || j.status === 'processing')

    return (
        <div className="fixed bottom-5 right-5 z-[200] w-72 rounded-2xl border border-border/70 bg-card shadow-2xl shadow-black/40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40 bg-secondary/30">
                <div className="flex items-center gap-1.5 flex-1">
                    {hasActive && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                    <span className="text-[11px] font-black text-foreground uppercase tracking-wider">
                        {hasActive ? 'Sincronizando...' : 'Sincronización completa'}
                    </span>
                </div>
                <button onClick={() => setMinimized(m => !m)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary/60 transition-colors">
                    {minimized ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
            </div>

            {/* Jobs list */}
            {!minimized && (
                <div className="divide-y divide-border/30 max-h-72 overflow-y-auto">
                    {activeJobs.map(job => (
                        <JobRow key={job.job_id} job={job} onRemove={() => removeJob(job.job_id)} />
                    ))}
                </div>
            )}
        </div>
    )
}
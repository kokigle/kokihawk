'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'

export type JobStatus = {
  job_id: string
  plataforma: 'meli' | 'tn'
  status: 'queued' | 'processing' | 'success' | 'error' | 'not_found' | 'timeout'
  procesados?: number
  total?: number
  actualizados?: number
  no_encontrados?: number
  errores?: number
  mensaje?: string
  nuevos_tokens?: { access_token: string; refresh_token: string }
  errores_detalle?: any[]
  last_heartbeat?: number  // unix timestamp from backend
  file_name?: string       // nombre del archivo para historial
}

type SyncJobsContextType = {
  jobs: JobStatus[]
  addJob: (job: Pick<JobStatus, 'job_id' | 'plataforma' | 'file_name'>) => void
  updateJob: (job_id: string, partial: Partial<JobStatus>) => void
  removeJob: (job_id: string) => void
  clearFinished: () => void
}

const SyncJobsContext = createContext<SyncJobsContextType | null>(null)

// Heartbeat timeout: if no heartbeat in 10 minutes, mark as failed
const HEARTBEAT_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

export function SyncJobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<JobStatus[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // 1. Al cargar la página, recuperar jobs del LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem('koki_active_jobs')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as JobStatus[]
        // On reload, check heartbeat for any "processing" jobs
        const now = Date.now()
        const checked = parsed.map(j => {
          if (
            (j.status === 'processing' || j.status === 'queued') &&
            j.last_heartbeat &&
            (now - j.last_heartbeat * 1000) > HEARTBEAT_TIMEOUT_MS
          ) {
            return { ...j, status: 'timeout' as const, mensaje: 'Sin señal del servidor por más de 10 minutos' }
          }
          return j
        })
        setJobs(checked)
      } catch (e) {
        console.error("Error leyendo jobs del storage")
      }
    }
    setIsLoaded(true)
  }, [])

  // 2. Cada vez que los jobs cambian, guardarlos en LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('koki_active_jobs', JSON.stringify(jobs))
    }
  }, [jobs, isLoaded])

  // 3. Heartbeat checker: runs every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setJobs(prev => prev.map(j => {
        if (
          (j.status === 'processing' || j.status === 'queued') &&
          j.last_heartbeat &&
          (now - j.last_heartbeat * 1000) > HEARTBEAT_TIMEOUT_MS
        ) {
          return { ...j, status: 'timeout', mensaje: 'Sin señal del servidor por más de 10 minutos' }
        }
        return j
      }))
    }, 30_000) // every 30s

    return () => clearInterval(interval)
  }, [])

  const addJob = useCallback((job: Pick<JobStatus, 'job_id' | 'plataforma' | 'file_name'>) => {
    setJobs(prev => {
      // Evitar duplicados por las dudas
      if (prev.find(j => j.job_id === job.job_id)) return prev;
      return [...prev, { ...job, status: 'queued' }]
    })
  }, [])

  const updateJob = useCallback((job_id: string, partial: Partial<JobStatus>) => {
    setJobs(prev => prev.map(j => j.job_id === job_id ? { ...j, ...partial } : j))
  }, [])

  const removeJob = useCallback((job_id: string) => {
    setJobs(prev => prev.filter(j => j.job_id !== job_id))
  }, [])

  const clearFinished = useCallback(() => {
    setJobs(prev => prev.filter(j => j.status === 'processing' || j.status === 'queued'))
  }, [])

  return (
    <SyncJobsContext.Provider value={{ jobs, addJob, updateJob, removeJob, clearFinished }}>
      {children}
    </SyncJobsContext.Provider>
  )
}

export function useSyncJobs() {
  const ctx = useContext(SyncJobsContext)
  if (!ctx) throw new Error('useSyncJobs must be used inside SyncJobsProvider')
  return ctx
}
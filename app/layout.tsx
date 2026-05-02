import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { SyncJobsProvider } from '@/contexts/SyncJobsContext'
import FloatingWidget from '@/components/dashboard/FloatingWidget'
import { Toaster } from 'sonner'

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: 'Kokihawk | Automatización y Sistemas para Empresas',
  description: '...',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <SyncJobsProvider>
          {children}
          <FloatingWidget />
          <Toaster position="top-right" richColors closeButton duration={4000} />
        </SyncJobsProvider>
      </body>
    </html>
  )
}
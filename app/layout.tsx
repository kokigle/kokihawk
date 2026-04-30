import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: 'Kokihawk | Automatización y Sistemas para Empresas',
  description: 'Desarrollamos sistemas a medida que eliminan el trabajo manual en tu empresa. Facturación automática, páginas web, análisis de ventas y más.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}

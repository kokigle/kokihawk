'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError('Credenciales incorrectas. Verificá tu email y contraseña.')
            setLoading(false)
        } else {
            router.push('/dashboard')
        }
    }

    return (
        <div className="min-h-screen bg-background flex">

            {/* ── Left panel: brand ─────────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border relative overflow-hidden flex-col justify-between p-12">

                {/* Grid texture background */}
                <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, currentColor 40px, currentColor 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, currentColor 40px, currentColor 41px)`
                }} />

                {/* Primary glow */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

                {/* Logo */}
                <div className="relative z-10">
                    <Link href="/" className="inline-block">
                        <Image
                            src="/logos/logo.png"
                            alt="KokiHawk"
                            width={160}
                            height={44}
                            className="object-contain h-11 w-auto"
                        />
                    </Link>
                </div>

                {/* Center content */}
                <div className="relative z-10 space-y-8">
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Sistema activo</span>
                        </div>

                        <h2 className="text-4xl font-black text-foreground leading-tight tracking-tight">
                            Automatizá tus<br />
                            <span className="text-primary italic">precios masivos</span><br />
                            en segundos.
                        </h2>

                        <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
                            Subí tu lista de precios, observá los precios finales de tus artículos, y actualizá Mercado Libre y Tienda Nube con un clic.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { value: '10x', label: 'Más rápido' },
                            { value: '0', label: 'Errores manuales' },
                            { value: '∞', label: 'Productos' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-secondary/50 border border-border/40 rounded-xl p-4 text-center">
                                <div className="text-2xl font-black text-primary">{stat.value}</div>
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Integration logos */}
                    <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Integraciones disponibles</p>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-secondary/40 border border-border/40 rounded-lg px-3 py-2">
                                <div className="w-5 h-5 rounded overflow-hidden bg-white flex items-center justify-center">
                                    <Image src="/logos/meli.png" alt="Mercado Libre" width={16} height={16} className="object-contain" />
                                </div>
                                <span className="text-xs font-semibold text-foreground">Mercado Libre</span>
                            </div>
                            <div className="flex items-center gap-2 bg-secondary/40 border border-border/40 rounded-lg px-3 py-2">
                                <div className="w-5 h-5 rounded overflow-hidden bg-white flex items-center justify-center">
                                    <Image src="/logos/tiendanube.png" alt="Tienda Nube" width={16} height={16} className="object-contain" />
                                </div>
                                <span className="text-xs font-semibold text-foreground">Tienda Nube</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Kokihawk. Desarrollado en Argentina 🇦🇷
                    </p>
                </div>
            </div>

            {/* ── Right panel: form ─────────────────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
                <div className="w-full max-w-md space-y-8">

                    {/* Mobile logo */}
                    <div className="lg:hidden mb-8">
                        <Link href="/">
                            <Image
                                src="/logos/logo.png"
                                alt="KokiHawk"
                                width={140}
                                height={38}
                                className="object-contain h-9 w-auto"
                            />
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tight text-foreground">
                            Iniciar sesión
                        </h1>
                        <p className="text-muted-foreground">
                            Accedé a tu panel de control y empezá a trabajar.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-sm">{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 bg-card border-border focus-visible:border-primary focus-visible:ring-primary/20 text-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                                Contraseña
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 bg-card border-border focus-visible:border-primary focus-visible:ring-primary/20 text-base"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Ingresando...
                                </>
                            ) : (
                                'Entrar al sistema'
                            )}
                        </Button>
                    </form>

                    {/* Back link */}
                    <div className="text-center">
                        <Link
                            href="/"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            ← Volver al sitio principal
                        </Link>
                    </div>

                    {/* Security note */}
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border/40">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary text-sm">🔒</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Acceso seguro mediante autenticación Supabase. Tus datos están protegidos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
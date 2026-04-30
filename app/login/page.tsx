'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Zap } from 'lucide-react'
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

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError('Credenciales incorrectas. Verificá tu email y contraseña.')
            setLoading(false)
        } else {
            router.push('/dashboard')
        }
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left panel - brand */}
            <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border relative overflow-hidden flex-col justify-between p-12">
                {/* Background texture */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 40px,
                            oklch(0.54 0.22 22 / 0.4) 40px,
                            oklch(0.54 0.22 22 / 0.4) 41px
                        ), repeating-linear-gradient(
                            90deg,
                            transparent,
                            transparent 40px,
                            oklch(0.54 0.22 22 / 0.4) 40px,
                            oklch(0.54 0.22 22 / 0.4) 41px
                        )`
                    }} />
                </div>

                {/* Glow */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

                {/* Logo */}
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-3 w-fit">
                        <div className="bg-primary rounded-xl p-2.5 shadow-lg shadow-primary/30">
                            <Zap className="h-6 w-6 text-primary-foreground fill-primary-foreground" />
                        </div>
                        <div>
                            <span className="font-black text-2xl tracking-tighter italic text-foreground">
                                KOKI<span className="text-primary">HAWK</span>
                            </span>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground -mt-1">PRO Platform</span>
                        </div>
                    </Link>
                </div>

                {/* Center content */}
                <div className="relative z-10 space-y-8">
                    <div className="space-y-4">
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
                            Subí tu lista de precios, mapeá las columnas una vez, y actualizá Mercado Libre y Tienda Nube con un clic.
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
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Kokihawk. Desarrollado en Argentina 🇦🇷
                    </p>
                </div>
            </div>

            {/* Right panel - form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="bg-primary rounded-xl p-2.5 shadow-lg shadow-primary/30">
                            <Zap className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
                        </div>
                        <span className="font-black text-xl tracking-tighter italic">
                            KOKI<span className="text-primary">HAWK</span>
                            <span className="text-muted-foreground font-medium not-italic"> PRO</span>
                        </span>
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
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-secondary/30 border border-border/40">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary text-xs">🔒</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Acceso seguro mediante autenticación Supabase. Tus datos están protegidos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
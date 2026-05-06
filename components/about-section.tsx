"use client"

import { motion } from "framer-motion"
import { User, Wrench, Shield } from "lucide-react"

const values = [
    {
        icon: User,
        title: "Trato directo",
        description:
            "Hablás con el desarrollador, no con un vendedor. Eso significa respuestas honestas, tiempos reales y sin promesas que no se cumplen.",
    },
    {
        icon: Wrench,
        title: "Soluciones a medida",
        description:
            "No vendemos paquetes cerrados. Analizamos tu empresa, entendemos cómo trabajás y desarrollamos lo que necesitás — no lo que es más fácil de vender.",
    },
    {
        icon: Shield,
        title: "Sistemas que duran",
        description:
            "Construimos con tecnología robusta y pensando en el largo plazo. Nada que se rompa a los seis meses o que necesite actualizaciones constantes.",
    },
]

export function AboutSection() {
    return (
        <section id="nosotros" className="relative py-20 md:py-28 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
            </div>

            <div className="relative container mx-auto px-4 md:px-8">
                <div className="max-w-5xl mx-auto">
                    {/* Two-column layout */}
                    <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">

                        {/* Left column */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                                Sobre nosotros
                            </span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">
                                Quiénes <span className="text-primary italic">somos</span>
                            </h2>
                            <div className="space-y-4 text-muted-foreground text-base leading-relaxed">
                                <p>
                                    Somos Kokihawk, un estudio de desarrollo de software enfocado en empresas mayoristas,
                                    distribuidoras e importadoras de Argentina.
                                </p>
                                <p>
                                    Nuestro trabajo es entender cómo funciona tu empresa y desarrollar las herramientas
                                    que te permitan hacer más con menos personal y menos errores.
                                </p>
                                <p>
                                    No somos una agencia grande con decenas de empleados. Somos un equipo chico y muy
                                    especializado, lo que nos permite conocer cada proyecto a fondo y dar soporte real.
                                </p>
                            </div>

                            {/* Tech stack */}
                            <div className="mt-8">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                    Tecnologías que usamos
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {["Python", "Next.js", "Mercado Libre API", "AFIP / ARCA", "PostgreSQL", "Mercado Pago API"].map((t) => (
                                        <span
                                            key={t}
                                            className="text-xs font-medium text-muted-foreground bg-secondary border border-border/60 rounded-md px-3 py-1"
                                        >
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Right column — values */}
                        <motion.div
                            className="space-y-5"
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            {values.map((v, i) => (
                                <motion.div
                                    key={v.title}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
                                    className="group flex gap-4 p-5 rounded-2xl border border-border/40 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                                        <v.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground mb-1.5">{v.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                    </div>
                </div>
            </div>
        </section>
    )
}

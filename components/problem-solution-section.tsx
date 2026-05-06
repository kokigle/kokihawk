"use client"

import { motion } from "framer-motion"
import { FileText, Clock, TrendingDown, AlertCircle } from "lucide-react"

const problems = [
    {
        icon: FileText,
        title: "Facturas que cargás a mano",
        description:
            "Cada venta genera una factura. Si tu equipo las carga una por una en AFIP, estás pagando horas de trabajo para hacer algo que una máquina puede hacer sola en segundos.",
    },
    {
        icon: Clock,
        title: "Horas perdidas en tareas que se repiten",
        description:
            "Actualizar precios en Mercado Libre, cargar pedidos al sistema, copiar datos de un Excel a otro... Todo eso se puede automatizar y liberar tiempo para lo que importa.",
    },
    {
        icon: TrendingDown,
        title: "No sabés qué productos te convienen",
        description:
            "Tenés miles de artículos y no sabés cuáles se venden bien y cuáles te generan pérdida. Sin esa información, es difícil tomar buenas decisiones de compra.",
    },
    {
        icon: AlertCircle,
        title: "Sistemas que no hablan entre sí",
        description:
            "Tu tienda online, tu sistema de stock y tu facturación son tres mundos separados. Cada uno por su lado significa más trabajo manual y más chances de cometer errores.",
    },
]

export function ProblemSolutionSection() {
    return (
        <section id="problemas" className="relative py-20 md:py-28 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background pointer-events-none" />

            <div className="relative container mx-auto px-4 md:px-8">
                {/* Section header */}
                <motion.div
                    className="max-w-2xl mx-auto text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-4">
                        El problema
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
                        ¿Te suena <span className="text-primary italic">conocido</span>?
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Son los mismos que tienen la mayoría de las empresas mayoristas y distribuidoras del país.
                    </p>
                </motion.div>

                {/* Problem cards */}
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {problems.map((problem, i) => (
                        <motion.div
                            key={problem.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.45 }}
                            className="group flex gap-5 p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                        >
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-300">
                                <problem.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground mb-2 text-base leading-snug">
                                    {problem.title}
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {problem.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

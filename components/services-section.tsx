"use client"

import { motion } from "framer-motion"
import { Globe, BarChart2, FileCheck, RefreshCw } from "lucide-react"

const services = [
    {
        icon: Globe,
        title: "Páginas web y tiendas online",
        description:
            "Diseñamos y desarrollamos su sitio web o tienda online. Simple de administrar, rápida y con buen posicionamiento en Google. Ideal para mayoristas que quieren tener presencia digital sin complicaciones.",
        tags: ["Sitio institucional", "Catálogo online", "Portal de clientes"],
    },
    {
        icon: BarChart2,
        title: "Análisis de ventas y rentabilidad",
        description:
            "Conectamos sus canales de venta (Mercado Libre, tienda propia, Excel) y le mostramos qué productos se venden, cuáles no y cuánto gana con cada uno. Sin planillas complicadas.",
        tags: ["Mercado Libre", "Reportes automáticos", "Dashboard de ventas"],
    },
    {
        icon: FileCheck,
        title: "Facturación automática con AFIP",
        description:
            "Cuando entra un pago, el sistema genera la factura electrónica y se la manda al cliente por mail. Solo. Sin que nadie tenga que hacer nada. Compatible con ARCA (ex-AFIP).",
        tags: ["AFIP / ARCA", "Factura electrónica", "Envío por mail"],
    },
    {
        icon: RefreshCw,
        title: "Actualización automática de precios",
        description:
            "Si sus precios cambian con el dólar o según el proveedor, podemos actualizar los precios en todos sus canales de venta en forma automática, sin que nadie lo tenga que hacer a mano.",
        tags: ["Mercado Libre", "Tienda propia", "Múltiples canales"],
    },
]

export function ServicesSection() {
    return (
        <section id="servicios" className="relative py-20 md:py-28 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/3 rounded-full blur-3xl -translate-y-1/2" />
                <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
            </div>

            <div className="relative container mx-auto px-4 md:px-8">
                {/* Header */}
                <motion.div
                    className="max-w-2xl mx-auto text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                        Nuestros servicios
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
                        Lo que <span className="text-primary italic">hacemos</span>
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Sistemas concretos para problemas reales. Sin tecnicismos, sin promesas vacías.
                    </p>
                </motion.div>

                {/* Service cards */}
                <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {services.map((service, i) => (
                        <motion.div
                            key={service.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.45 }}
                            className="group relative p-7 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
                        >
                            {/* Hover gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="relative">
                                {/* Icon */}
                                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors duration-300">
                                    <service.icon className="h-6 w-6 text-primary" />
                                </div>

                                {/* Title + description */}
                                <h3 className="text-lg font-bold text-foreground mb-3 leading-snug">
                                    {service.title}
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                                    {service.description}
                                </p>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {service.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-xs font-medium text-muted-foreground bg-secondary border border-border/60 rounded-md px-2.5 py-1"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

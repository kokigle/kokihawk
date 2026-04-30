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
    <section id="servicios" className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <motion.div
          className="max-w-2xl mx-auto text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Lo que hacemos
          </h2>
          <p className="text-muted-foreground text-lg">
            Sistemas concretos para problemas reales. Sin tecnicismos, sin promesas vacías.
          </p>
        </motion.div>

        {/* Service cards — spacious, corporate look */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className="group p-7 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors duration-300">
                <service.icon className="h-6 w-6 text-primary" />
              </div>

              {/* Title + description */}
              <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug">
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

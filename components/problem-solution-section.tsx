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
    <section id="problemas" className="py-20 md:py-28 bg-secondary/20">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section header */}
        <motion.div
          className="max-w-2xl mx-auto text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            ¿Te suena conocido alguno de estos problemas?
          </h2>
          <p className="text-muted-foreground text-lg">
            Son los mismos que tienen la mayoría de las empresas mayoristas y distribuidoras del país.
          </p>
        </motion.div>

        {/* Problem cards — 2x2 grid, clean and spacious */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className="flex gap-5 p-6 rounded-xl border border-border/50 bg-card hover:border-border transition-colors duration-300"
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                <problem.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2 text-base leading-snug">
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

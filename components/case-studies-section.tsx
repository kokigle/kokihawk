"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ToyBrick, ShoppingCart, Receipt } from "lucide-react"

const cases = [
  {
    icon: ToyBrick,
    client: "Kokos Argentina",
    sector: "Mayorista de Juguetes",
    headline: "Portal privado para clientes mayoristas",
    description:
      "Desarrollo de una página web a medida con un sistema avanzado de usuarios. Le dimos a la empresa una plataforma privada y segura para que sus clientes mayoristas puedan operar fácilmente.",
    result: "Sus clientes mayoristas hacen sus pedidos online sin necesidad de llamar o mandar mensajes.",
  },
  {
    icon: ShoppingCart,
    client: "Compranet Argentina",
    sector: "E-commerce y Distribución",
    headline: "Sistema de análisis de ventas en Mercado Libre",
    description:
      "Creación de un sistema inteligente que se conecta directamente a Mercado Libre. Analiza automáticamente las publicaciones y calcula el porcentaje de conversión de cada producto (Ventas / Visitas × 100). Así, el dueño sabe exactamente qué artículos son rentables y cuáles no, sin hacer cálculos manuales.",
    result: "El dueño sabe en tiempo real qué publicaciones rinden y cuáles hay que discontinuar.",
  },
  {
    icon: Receipt,
    client: "Integración Mercado Pago + AFIP",
    sector: "Automatización Contable",
    headline: "Facturación electrónica automática",
    description:
      "Desarrollo de un robot automático que detecta cuando entra un pago, genera la factura electrónica en AFIP y se la manda por mail al cliente al instante. Cero intervención humana.",
    result: "El cliente recibe su factura antes de terminar de revisar el comprobante de pago.",
  },
]

export function CaseStudiesSection() {
  return (
    <section id="casos" className="py-20 md:py-28 bg-secondary/20">
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
            Empresas que ya trabajan con nosotros
          </h2>
          <p className="text-muted-foreground text-lg">
            Proyectos reales, con resultados concretos. Ningún caso de estudio inventado.
          </p>
        </motion.div>

        {/* Case cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {cases.map((c, i) => (
            <motion.div
              key={c.client}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="h-full"
            >
              <Card className="h-full flex flex-col bg-card border border-border/50 hover:border-border transition-colors duration-300 rounded-xl overflow-hidden">
                {/* Top accent bar */}
                <div className="h-1 w-full bg-primary/60" />

                <CardHeader className="pb-3 pt-6 px-6">
                  {/* Icon + sector badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <c.icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-xs text-muted-foreground bg-secondary/80 border border-border/60 font-normal"
                    >
                      {c.sector}
                    </Badge>
                  </div>

                  {/* Client name */}
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                    {c.client}
                  </p>
                  <h3 className="text-base font-bold text-foreground leading-snug">
                    {c.headline}
                  </h3>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 gap-4 px-6 pb-6">
                  {/* Full case description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {c.description}
                  </p>

                  {/* Result callout */}
                  <div className="mt-auto pt-4 border-t border-border/40">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                      Resultado
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {c.result}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

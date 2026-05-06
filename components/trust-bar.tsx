"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const clients = [
  { name: "Kokos Argentina", logo: "/logos/kokos.png" },
  { name: "Compranet Argentina", logo: "/logos/compranet.png" },
]

export function TrustBar() {
  return (
    <section className="relative border-y border-border/40 bg-secondary/20 py-10 md:py-12 overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/0 via-primary/[0.02] to-background/0 pointer-events-none" />

      <div className="relative container mx-auto px-4 md:px-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8"
        >
          Empresas que ya trabajan con nosotros
        </motion.p>
        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20">
          {clients.map((client, i) => (
            <motion.div
              key={client.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
            >
              <Image
                src={client.logo}
                alt={client.name}
                width={140}
                height={44}
                className="h-10 w-auto object-contain opacity-50 hover:opacity-90 transition-opacity duration-300 grayscale hover:grayscale-0"
                style={{ width: "auto" }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

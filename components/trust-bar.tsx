"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const clients = [
  { name: "Kokos Argentina", logo: "/logos/kokos.png" },
  { name: "Compranet Argentina", logo: "/logos/compranet.png" },
]

export function TrustBar() {
  return (
    <section className="border-y border-border/40 bg-secondary/30 py-8 md:py-10">
      <div className="container mx-auto px-4 md:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-7">
          Empresas que ya trabajan con nosotros
        </p>
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
          {clients.map((client, i) => (
            <motion.div
              key={client.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
            >
              <Image
                src={client.logo}
                alt={client.name}
                width={140}
                height={44}
                className="h-10 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300"
                style={{ width: "auto" }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

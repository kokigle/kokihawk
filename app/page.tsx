'use client'

import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { TrustBar } from "@/components/trust-bar"
import { ProblemSolutionSection } from "@/components/problem-solution-section"
import { ServicesSection } from "@/components/services-section"
import { CaseStudiesSection } from "@/components/case-studies-section"
import { AboutSection } from "@/components/about-section"
import { TutorialSection } from "@/components/tutorial-section"
import { FooterCTA } from "@/components/footer-cta"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

function ScrollProgress() {
    const { scrollYProgress } = useScroll()
    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80 origin-left z-[100]"
            style={{ scaleX: scrollYProgress }}
        />
    )
}

function ScrollReveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

function StatsSection() {
    const stats = [
        { value: "10x", label: "Más rápido que actualizar a mano", suffix: "" },
        { value: "0", label: "Instalación requerida — todo en la nube", suffix: "" },
        { value: "100%", label: "Compatible con cualquier lista de precios", suffix: "" },
        { value: "24/7", label: "Soporte en español, siempre disponible", suffix: "" },
    ]

    return (
        <section className="relative py-20 md:py-28 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.03] to-background" />
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-7xl mx-auto px-5 md:px-8">
                <ScrollReveal>
                    <div className="text-center mb-14">
                        <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                            Por qué KokiHawk
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
                            Números que <span className="text-primary italic">hablan</span>
                        </h2>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {stats.map((stat, i) => (
                        <ScrollReveal key={stat.label} delay={i * 0.1}>
                            <div className="group relative bg-card border border-border/50 rounded-2xl p-6 text-center hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300" />
                                <div className="relative">
                                    <p className="text-4xl md:text-5xl font-black text-primary mb-2 tracking-tight">
                                        {stat.value}
                                    </p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {stat.label}
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    )
}

function HowItWorksSection() {
    const steps = [
        {
            num: "01",
            title: "Subí tu lista",
            desc: "Arrastrá tu Excel o CSV. Nuestro sistema detecta automáticamente las columnas y el formato.",
            icon: "Upload",
        },
        {
            num: "02",
            title: "Configurá tus reglas",
            desc: "Definí aumentos, redondeos, IVA y ajustes por plataforma. Guardalo como plantilla para siempre.",
            icon: "Settings",
        },
        {
            num: "03",
            title: "Revisá y sincronizá",
            desc: "Revisá los precios calculados, detectamos anomalías automáticamente. Un clic y listo.",
            icon: "Zap",
        },
    ]

    return (
        <section className="relative py-20 md:py-28">
            <div className="max-w-7xl mx-auto px-5 md:px-8">
                <ScrollReveal>
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                            Así de simple
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-4">
                            Tres pasos. <span className="text-primary italic">Cero complicaciones.</span>
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Desde que subís tu lista hasta que tus precios se actualizan en todas las plataformas.
                        </p>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connector line */}
                    <div className="hidden md:block absolute top-14 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                    {steps.map((step, i) => (
                        <ScrollReveal key={step.num} delay={i * 0.15}>
                            <div className="relative group text-center">
                                {/* Step number */}
                                <div className="relative mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/10">
                                    <span className="text-2xl font-black text-primary">{step.num}</span>
                                </div>

                                <h3 className="text-xl font-black text-foreground mb-3">{step.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                                    {step.desc}
                                </p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default function Home() {
    return (
        <main className="min-h-screen bg-background">
            <ScrollProgress />
            <Navbar />
            <HeroSection />
            <TrustBar />
            <HowItWorksSection />
            <StatsSection />
            <ProblemSolutionSection />
            <ServicesSection />
            <TutorialSection />
            <CaseStudiesSection />
            <AboutSection />
            <FooterCTA />
        </main>
    )
}

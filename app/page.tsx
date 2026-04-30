import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { TrustBar } from "@/components/trust-bar"
import { ProblemSolutionSection } from "@/components/problem-solution-section"
import { ServicesSection } from "@/components/services-section"
import { CaseStudiesSection } from "@/components/case-studies-section"
import { AboutSection } from "@/components/about-section"
import { FooterCTA } from "@/components/footer-cta"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <TrustBar />
      <ProblemSolutionSection />
      <ServicesSection />
      <CaseStudiesSection />
      <AboutSection />
      <FooterCTA />

      {/* Floating Pro Access Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <Link
          href="/login"
          className="group flex items-center gap-3 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-2xl shadow-primary/30 font-bold text-sm tracking-wide hover:shadow-primary/50 hover:scale-105 transition-all duration-300"
        >
          <span className="w-2 h-2 rounded-full bg-primary-foreground/80 group-hover:bg-primary-foreground animate-pulse" />
          Acceder a KokiHawk PRO
        </Link>
      </div>
    </main>
  )
}
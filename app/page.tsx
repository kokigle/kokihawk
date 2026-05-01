import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { TrustBar } from "@/components/trust-bar"
import { ProblemSolutionSection } from "@/components/problem-solution-section"
import { ServicesSection } from "@/components/services-section"
import { CaseStudiesSection } from "@/components/case-studies-section"
import { AboutSection } from "@/components/about-section"
import { FooterCTA } from "@/components/footer-cta"

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
    </main>
  )
}

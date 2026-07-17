import AboutSection from "@/components/sections/AboutSection";
import ContactSection from "@/components/sections/ContactSection";
import HeroSection from "@/components/sections/HeroSection";
import MouseSection from "@/components/sections/MouseSection";

export default function Home() {
  return (
    <main id="main">
      <MouseSection />
      <HeroSection />
      <AboutSection />
      <ContactSection />
    </main>
  )
}

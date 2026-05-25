import { Header } from "@/components/layout/header";
import { Hero } from "@/components/landing/hero";
import { DemoSection } from "@/components/landing/demo-section";
import { GeoPreview } from "@/components/landing/geo-preview";
import { PipelineSection } from "@/components/landing/pipeline";
import { FeaturesGrid } from "@/components/landing/features";
import { Testimonials } from "@/components/landing/testimonials";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <DemoSection />
        <GeoPreview />
        <PipelineSection />
        <FeaturesGrid />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}

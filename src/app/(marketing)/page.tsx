import { Ecosystem } from "@/components/marketing/ecosystem";
import { FeatureStrip } from "@/components/marketing/feature-strip";
import { Hero } from "@/components/marketing/hero";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import {
  AudiencesSection,
  FeaturesSection,
  FinalCta,
  PricingSection,
  TrustSection,
  WhySection,
} from "@/components/marketing/sections";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <FeatureStrip />
        <Ecosystem />
        <FeaturesSection />
        <WhySection />
        <AudiencesSection />
        <TrustSection />
        <PricingSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}

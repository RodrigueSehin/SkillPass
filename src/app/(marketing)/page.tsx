import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Hero } from "@/components/marketing/hero";
import {
  AudiencesSection,
  FeaturesSection,
  FinalCta,
  HowItWorksSection,
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
        <WhySection />
        <FeaturesSection />
        <HowItWorksSection />
        <AudiencesSection />
        <TrustSection />
        <PricingSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}

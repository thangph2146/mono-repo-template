import { HeroSection } from "./sub-sections/hero-section";
import { HERO_DATA } from "./data";
import { AboutHubSection } from "./sub-sections/about-hub-section";
import { OverviewSection } from "./sub-sections/overview-section";
import { GuideRegisterSection } from "./sub-sections/guide-register-section";
import { ContactSection } from "./sub-sections/contact-section";

export const HomeClient = () => (
  <div className="isolate bg-background">
    <HeroSection {...HERO_DATA} />
    <AboutHubSection />
    <OverviewSection className="min-h-[calc(100vh-56px)]" />
    <GuideRegisterSection />
    <ContactSection />
  </div>
);

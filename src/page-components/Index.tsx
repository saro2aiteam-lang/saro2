"use client";

import Navigation from "@/components/Navigation";
import Hero from "@/components/home/Hero";
import WhyThisMatters from "@/components/home/WhyThisMatters";
import DemoGallery from "@/components/home/DemoGallery";
import HowItWorks from "@/components/home/HowItWorks";
import PricingSection from "@/components/home/PricingSection";
import FaqTeaser from "@/components/home/FaqTeaser";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";
import FadeInSection from "@/components/FadeInSection";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Sora 2 AI Video Generator | Text-to-Video with Sora-Level Quality"
        description="Create cinematic videos from text prompts. Advanced motion realism, multi-shot storytelling, and creative control. Independent platform, easy to use."
        ogTitle="Sora 2 AI Video Generator | Text-to-Video with Sora-Level Quality"
        ogDescription="Create cinematic videos from text prompts. Advanced motion realism, multi-shot storytelling, and creative control. Independent platform, easy to use."
        canonical="https://saro2.ai/"
        keywords="AI video ads, Sora 2 Storyboard, sora 2 storyboard, multi-scene storyboard, consistent characters, 25 second AI video, vertical ad templates, TikTok ad generator, Shopify product video, AI storyboard builder"
      />
      <ScrollProgress />
      <Navigation />
      
      {/* Hero Section */}
      <Hero />
      
      {/* Demo Gallery */}
      <FadeInSection delay={200}>
        <DemoGallery />
      </FadeInSection>
      
      {/* Why This Matters & Key Features */}
      <FadeInSection delay={400}>
        <WhyThisMatters />
      </FadeInSection>
      
      {/* How It Works */}
      <FadeInSection delay={600}>
        <HowItWorks />
      </FadeInSection>
      
      {/* FAQ Teaser */}
      <FadeInSection delay={800}>
        <FaqTeaser />
      </FadeInSection>
      
      {/* Pricing Section */}
      <FadeInSection delay={1000}>
        <PricingSection />
      </FadeInSection>

      <Footer />
    </div>
  );
};

export default Index;

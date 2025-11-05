import { Button } from "@/components/ui/button";
import { Play, Code, Zap, Shield } from "lucide-react";
import Image from "next/image";
import heroImage from "@/assets/hero-video.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full filter blur-3xl animate-float-delayed" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 opacity-10 rounded-full filter blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight font-display">
                <span className="text-primary">
                  Sora2 Studio
                </span>
                <br />
                <span className="text-foreground">for Builders & Teams</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                Generate cinematic AI video with the latest Sora2 models. Text-to-video and image-to-video。
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
              <div className="flex items-center space-x-2 text-sm glass-effect rounded-lg px-3 py-2 hover-lift">
                <Zap className="w-4 h-4 text-primary animate-glow-pulse" />
                <span className="font-medium">Sora2 Fast</span>
              </div>
              <div className="flex items-center space-x-2 text-sm glass-effect rounded-lg px-3 py-2 hover-lift">
                <Shield className="w-4 h-4 text-primary animate-glow-pulse" />
                <span className="font-medium">Enterprise Security</span>
              </div>
              <div className="flex items-center space-x-2 text-sm glass-effect rounded-lg px-3 py-2 hover-lift">
                <Code className="w-4 h-4 text-primary animate-glow-pulse" />
                <span className="font-medium">REST / SDK</span>
              </div>
              <div className="flex items-center space-x-2 text-sm glass-effect rounded-lg px-3 py-2 hover-lift">
                <Play className="w-4 h-4 text-primary animate-glow-pulse" />
                <span className="font-medium">Native Audio</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="group" onClick={() => (window.location.pathname = '/text-to-video')}>
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Generate Video
              </Button>
              <Button variant="outline" size="lg" onClick={() => (window.location.pathname = '/plans')}>
                <Code className="w-5 h-5 mr-2" />
                View Pricing
              </Button>
            </div>

            {/* Quick stats with animated counters */}
            <div className="flex justify-center lg:justify-start space-x-8 text-sm text-muted-foreground">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary font-display">8-16s</div>
                <div className="text-xs">Video Length</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary font-display">1080p</div>
                <div className="text-xs">HD Output</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary font-display"><span className="font-display">~45s</span></div>
                <div className="text-xs">Avg Render</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative animate-float">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 hover-lift">
              <Image 
                src={heroImage} 
                alt="AI Video Generation Platform" 
                className="w-full h-auto"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
              
              {/* Floating elements with animations */}
              <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-code hover-lift animate-scale-in">
                <span className="text-primary font-semibold">POST</span> /api/videos/generate
              </div>
              
              <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-4 py-2 hover-lift animate-scale-in">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-sm font-semibold text-primary">✓ Generated in 45s</div>
              </div>
            </div>

            {/* Decorative elements with animation */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/20 rounded-full filter blur-xl animate-float" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/20 rounded-full filter blur-xl animate-float-delayed" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

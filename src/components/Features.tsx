import { Card } from "@/components/ui/card";
import { Code, Zap, Shield, Cloud, Webhook, BarChart3 } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Code,
      title: "REST API First",
      description: "Simple HTTP endpoints for seamless integration. Complete with SDKs for Python, Node.js, and cURL examples.",
      highlight: "API-First"
    },
    {
      icon: Zap,
      title: "Sora2 Fast Model",
      description: "Access the latest Sora2 Fast for rapid video generation. 3x faster than standard models.",
      highlight: "Fast Generation"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "SOC2 compliant infrastructure, API key authentication, and IP whitelisting for enterprise accounts.",
      highlight: "Enterprise Ready"
    },
    {
      icon: Cloud,
      title: "CDN Distribution",
      description: "Global CDN hosting for instant video delivery. 99.9% uptime SLA with automatic scaling.",
      highlight: "Global CDN"
    },
    {
      icon: Webhook,
      title: "Webhook Support",
      description: "Real-time notifications when videos are ready. Perfect for async workflows and batch processing.",
      highlight: "Webhooks"
    },
    {
      icon: BarChart3,
      title: "Usage Analytics",
      description: "Detailed analytics dashboard with usage metrics, cost tracking, and performance monitoring.",
      highlight: "Analytics"
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-display">
            <span className="text-primary">
              Professional API Platform
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Built for developers, studios, and enterprises who need reliable AI video generation at scale.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
            >
              <div className="space-y-4">
                {/* Icon with highlight badge */}
                <div className="relative">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full font-medium ">
                    {feature.highlight}
                  </div>
                </div>
                
                {/* Content */}
                <div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors font-display">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 bg-card/50 backdrop-blur-sm border border-border rounded-lg px-6 py-3">
            <Code className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Ready to get started?</span>
            <a 
            href="/text-to-video" 
              className="text-primary hover:text-primary-glow transition-colors font-medium"
            >
              Start Generating Videos →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;

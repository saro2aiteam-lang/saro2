import { Play, Github, Twitter, Mail } from "lucide-react";
import Image from "next/image";

const Footer = () => {
  const navigation = {
    product: [
      { name: "Sora 2 Text to Video", href: "/text-to-video", external: false },
      { name: "Sora 2 Image to Video", href: "/image-to-video", external: false },
      { name: "Sora 2 Pricing", href: "/plans", external: false },
      { name: "Sora 2 FAQ", href: "/faq", external: false },
    ],
    company: [
      { name: "Sora 2 Blog", href: "/blog", external: false },
    ],
    resources: [
      { name: "AI Video Prompt GPT", href: "https://chatgpt.com/g/g-690c3e49fb308191aa623c67543a766a-sarogpt-ai-video-prompt-script-assistant", external: true },
      { name: "Privacy Policy", href: "/privacy", external: false },
      { name: "Terms of Service", href: "/terms", external: false },
      { name: "Refund Policy", href: "/refund", external: false },
    ],
    support: [
      { name: "24/7 Support", href: "mailto:support@saro2.ai", external: true },
      { name: "Contact Us / Partnership", href: "mailto:team@saro2.ai", external: true },
    ],
  } as const;

  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image 
                  src="/logo.png" 
                  alt="Logo" 
                  width={32} 
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold text-primary">
                Saro 2
              </span>
            </div>
            <p className="text-muted-foreground text-sm mb-4 max-w-sm">
              Sora 2 AI Video Generator. Create cinematic videos with Sora 2 text-to-video, image-to-video, and Sora 2 Storyboard (multi-scene storyboard). Sora 2 access with no watermark.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://x.com/saro2aiteam" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="mailto:support@saro2.ai" 
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Product</h3>
            <ul className="space-y-2">
              {navigation.product.map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Company</h3>
            <ul className="space-y-2">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Resources</h3>
            <ul className="space-y-2">
              {navigation.resources.map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Support</h3>
            <ul className="space-y-2">
              {navigation.support.map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 space-y-2">
          <p className="text-xs text-muted-foreground max-w-4xl">
            Saro2.ai is an independent AI video generation platform. It is not affiliated with, endorsed by, or sponsored by OpenAI or any official "Sora" products. All trademarks belong to their respective owners.
          </p>
          <p className="text-xs text-muted-foreground max-w-4xl">
            Powered by proprietary video synthesis workflows. Not affiliated with any official vendor.
          </p>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground">
              © 2024 Sora 2. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" aria-hidden="true" />
                <a 
                  href="mailto:support@saro2.ai"
                  className="hover:text-primary transition-colors"
                >
                  24/7 Support: support@saro2.ai
                </a>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" aria-hidden="true" />
                <a 
                  href="mailto:team@saro2.ai"
                  className="hover:text-primary transition-colors"
                >
                  Business & Partnership: team@saro2.ai
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

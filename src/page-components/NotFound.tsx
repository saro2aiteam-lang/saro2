"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const NotFound = () => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full space-y-6">
          <div className="space-y-2">
            <h1 className="text-6xl sm:text-7xl font-bold text-primary">404</h1>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              Page Not Found
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
            {pathname && (
              <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded inline-block">
                {pathname}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Return to Home
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <button type="button" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </button>
            </Button>
          </div>

          <div className="pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Popular pages:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                href="/text-to-video"
                className="text-sm text-primary hover:underline"
              >
                Text to Video
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/plans"
                className="text-sm text-primary hover:underline"
              >
                Pricing Plans
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/faq"
                className="text-sm text-primary hover:underline"
              >
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;

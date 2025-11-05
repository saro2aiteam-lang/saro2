"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-primary">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
        <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button size="lg">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

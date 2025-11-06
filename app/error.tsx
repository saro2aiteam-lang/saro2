"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error to console for debugging
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Something went wrong!</h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} variant="default" className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Need help? Contact{" "}
            <a
              href="mailto:support@saro2.ai?subject=Application Error"
              className="text-primary hover:underline"
            >
              support@saro2.ai
            </a>
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="text-left bg-muted p-4 rounded-md mt-4">
            <summary className="cursor-pointer font-medium mb-2">
              Error Details (Development Only)
            </summary>
            <pre className="text-xs text-destructive whitespace-pre-wrap overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}


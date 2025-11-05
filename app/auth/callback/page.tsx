"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Processing sign-in, please wait…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const handleAuthCallback = async () => {
      try {
        console.log("🔐 Starting auth callback processing...");
        
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          console.error("❌ Not in browser environment");
          return;
        }

        // Log current URL for debugging
        console.log("📍 Current URL:", window.location.href);
        console.log("📍 URL search params:", window.location.search);
        console.log("📍 URL hash:", window.location.hash);

        // Check Supabase configuration
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          console.error("❌ Missing Supabase configuration");
          setError("Configuration error. Please contact support.");
          setMessage("Configuration error. Please contact support.");
          return;
        }

        console.log("✅ Supabase URL configured:", supabaseUrl);
        console.log("✅ Supabase key configured:", supabaseKey ? "Yes" : "No");

        // Test Supabase connection first
        try {
          const { data: testData, error: testError } = await supabase.auth.getSession();
          console.log("🔍 Supabase connection test:", { 
            hasData: !!testData, 
            hasError: !!testError,
            errorMessage: testError?.message 
          });
        } catch (testErr) {
          console.error("❌ Supabase connection failed:", testErr);
          setError("Connection error. Please check your internet connection and try again.");
          setMessage("Connection error. Please check your internet connection and try again.");
          return;
        }

        // Process the auth callback
        console.log("🔄 Processing auth callback...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Auth callback error:", error);
          setError(`Authentication failed: ${error.message}`);
          setMessage("Sign-in failed. Please try again or contact support.");
          
          // Redirect to sign-in after a delay
          timeoutId = setTimeout(() => {
            if (mounted) {
              router.replace("/auth/email");
            }
          }, 3000);
          return;
        }

        if (mounted) {
          if (data.session) {
            console.log("✅ Authentication successful:", data.session.user.email);
            setMessage("Signed in successfully! Redirecting…");
            setError(null);
            
            // Redirect to main app
            timeoutId = setTimeout(() => {
              router.replace("/text-to-video");
            }, 1000);
          } else {
            console.log("⚠️ No session found");
            setMessage("No session found. Redirecting to sign-in…");
            setError(null);
            
            // Redirect to sign-in
            timeoutId = setTimeout(() => {
              router.replace("/auth/email");
            }, 2000);
          }
        }
      } catch (e) {
        console.error("❌ Unexpected error in auth callback:", e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred";
        setError(`Error: ${errorMessage}`);
        setMessage("An unexpected error occurred. Please try again.");
        
        // Redirect to sign-in after error
        timeoutId = setTimeout(() => {
          if (mounted) {
            router.replace("/auth/email");
          }
        }, 3000);
      }
    };

    // Add a small delay to ensure the page is fully loaded
    timeoutId = setTimeout(handleAuthCallback, 100);

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {error ? "Authentication Error" : "Processing Sign-in"}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {message}
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <div className="text-xs text-gray-500">
            If this page doesn't redirect automatically, 
            <a href="/auth/email" className="text-blue-600 hover:text-blue-800 underline ml-1">
              click here to sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}


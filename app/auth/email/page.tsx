"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";

export default function EmailAuthPage() {
  const isProduction = process.env.NODE_ENV === "production";
  const baseUrl = isProduction
    ? (process.env.NEXT_PUBLIC_APP_URL || "https://saro2.ai")
    : (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Auth
          supabaseClient={supabase}
          view="magic_link"
          appearance={{
            theme: ThemeSupa,
            className: {
              container: "space-y-4",
              label: "text-foreground",
              input: "bg-background border border-border text-foreground placeholder:text-muted-foreground",
              button: "bg-primary text-primary-foreground hover:bg-primary/90",
              anchor: "text-primary hover:underline",
              divider: "text-muted-foreground",
              message: "text-muted-foreground",
              // social button not typed; rely on default styles
            },
            variables: {
              default: {
                colors: {
                  brand: '#7c3aed',
                  brandAccent: '#6d28d9',
                  inputBackground: 'transparent',
                  inputText: 'hsl(var(--foreground))',
                  anchorTextColor: 'hsl(var(--primary))',
                },
              },
            },
          }}
          providers={["google"]}
          redirectTo={`${baseUrl}/auth/callback`}
          showLinks={false}
          localization={{
            variables: {
              sign_in: { email_label: "Email", button_label: "Continue" },
              magic_link: { email_input_label: "Email", button_label: "Continue", link_text: "Send magic link" },
            },
          }}
          magicLink
        />
      </div>
    </div>
  );
}



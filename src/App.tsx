import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import { CreditsProvider } from './contexts/CreditsContext';
import { ThemeProvider } from "./components/ThemeProvider";
import Index from "./page-components/Index";
// import Generate from "./page-components/Generate";
import Account from "./page-components/Account";
import Blog from "./page-components/Blog";
import Pricing from "./page-components/Pricing";
import AuthCallback from "./page-components/AuthCallback";
import NotFound from "./page-components/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <AuthProvider>
        <CreditsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* /generate route removed; use /text-video or /image-to-video */}
                <Route path="/account" element={<Account />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/plans" element={<Pricing />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CreditsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, X, ImageIcon, FileText, Clapperboard, ArrowUpRight, Home, LayoutDashboard, DollarSign, BookOpen, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    name: "Image To Video",
    href: "/image-to-video",
    icon: ImageIcon,
  },
  {
    name: "Text To Video",
    href: "/text-to-video",
    icon: FileText,
  },
  {
    name: "Multi-scene (25s)",
    href: "/multi-scene",
    icon: Clapperboard,
  },
  {
    name: "Watermark Remover",
    href: "/watermark-remover",
    icon: Eraser,
  },
];

const GenerateSidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false); // Default to expanded (show text)
  const [isMounted, setIsMounted] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);

  // Ensure client-side only for localStorage access
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedState = localStorage.getItem("sidebar-collapsed");
      // Only use saved state if it exists, otherwise default to expanded
      if (savedState !== null) {
        const parsed = JSON.parse(savedState);
        setIsCollapsed(parsed);
      }
      // If no saved state, keep default false (expanded)
    } catch (error) {
      console.warn("Failed to load sidebar state from localStorage:", error);
      // Keep default false (expanded) on error
    }
  }, []);

  // Sync pathname after mount to avoid hydration mismatch
  useEffect(() => {
    if (isMounted) {
      setCurrentPath(pathname);
    }
  }, [pathname, isMounted]);

  // Save collapsed state to localStorage (only on client)
  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
      } catch (error) {
        console.warn("Failed to save sidebar state to localStorage:", error);
      }
    }
  }, [isCollapsed, isMounted]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Update CSS variable for main content margin (only on client)
  useEffect(() => {
    if (isMounted && typeof document !== 'undefined') {
      try {
        const root = document.documentElement;
        root.style.setProperty('--sidebar-width', isCollapsed ? '60px' : '240px');
      } catch (error) {
        console.warn("Failed to set sidebar width CSS variable:", error);
      }
    }
  }, [isCollapsed, isMounted]);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-background border-r border-border transition-all duration-300 z-50 flex flex-col ${
        isCollapsed ? "w-[60px]" : "w-[240px]"
      }`}
    >
      {/* Top Section: Logo and Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && isMounted && (
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <Image
                src="/logo.png"
                alt="Saro 2 Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold text-primary">Saro 2</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg overflow-hidden mx-auto">
            <Image
              src="/favicon.png"
              alt="aivido Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className={`ml-auto p-2 rounded-lg hover:bg-muted transition-colors ${
            isCollapsed ? "mx-auto" : ""
          }`}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <Menu className="w-5 h-5 text-foreground" />
          ) : (
            <X className="w-5 h-5 text-foreground" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="space-y-1 px-2">
          {/* Home Link */}
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
              isMounted && currentPath === "/"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title={isCollapsed ? "Home" : undefined}
          >
            <Home
              className={`flex-shrink-0 ${
                isCollapsed ? "w-5 h-5 mx-auto" : "w-5 h-5"
              }`}
            />
            {!isCollapsed && isMounted && (
              <span className="text-sm font-medium">Home</span>
            )}
          </Link>

          {/* Separator */}
          <div className="my-2 border-t border-border" />

          {/* Other Navigation Items */}
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isMounted && currentPath === item.href;
            const href = item.href;

            return (
              <Link
                key={`nav-${index}-${href}`}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon
                  className={`flex-shrink-0 ${
                    isCollapsed ? "w-5 h-5 mx-auto" : "w-5 h-5"
                  }`}
                />
                {!isCollapsed && isMounted && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}

          {/* Separator */}
          <div className="my-2 border-t border-border" />

          {/* Additional Navigation Items */}
          {[
            {
              name: "Dashboard",
              href: "/dashboard",
              icon: LayoutDashboard,
            },
            {
              name: "Pricing",
              href: "/plans",
              icon: DollarSign,
            },
            {
              name: "Blog",
              href: "/blog",
              icon: BookOpen,
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = isMounted && currentPath === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon
                  className={`flex-shrink-0 ${
                    isCollapsed ? "w-5 h-5 mx-auto" : "w-5 h-5"
                  }`}
                />
                {!isCollapsed && isMounted && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Section: AI Tools Label and Upgrade Button */}
      <div className="border-t border-border p-4 space-y-3">
        {!isCollapsed && isMounted && (
          <p className="text-xs text-muted-foreground font-medium mb-2">AI Tools</p>
        )}
        <Link href="/plans" className="block">
          <Button
            variant="default"
            className={`w-full ${isCollapsed ? 'px-2 py-2' : 'py-2.5'} bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
            title={isCollapsed ? "Upgrade Now" : undefined}
          >
            {isCollapsed || !isMounted ? (
              <ArrowUpRight className="w-5 h-5" />
            ) : (
              <>
                <span className="text-sm font-semibold">Upgrade Now</span>
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </Link>
      </div>
    </aside>
  );
};

export default GenerateSidebar;

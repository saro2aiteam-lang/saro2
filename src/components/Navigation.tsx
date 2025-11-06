"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Play, DollarSign, BookOpen, User, LogOut, Home, ChevronDown, Settings, Clapperboard, Image as ImageIcon, FileText, Eraser } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";
import AuthModal from "./AuthModal";
import PromoBanner from "./PromoBanner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [bannerHeight, setBannerHeight] = useState('0px');
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    
    // Listen for CSS variable changes
    const updateBannerHeight = () => {
      const height = getComputedStyle(document.documentElement).getPropertyValue('--banner-height');
      setBannerHeight(height || '0px');
    };

    // Initial check
    updateBannerHeight();

    // Listen for changes
    const observer = new MutationObserver(updateBannerHeight);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    });

    return () => observer.disconnect();
  }, []);

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Generate", href: "/text-to-video", icon: Play },
    { name: "Pricing", href: "/plans", icon: DollarSign },
    { name: "Blog", href: "/blog", icon: BookOpen },
  ];

  // Get user display name and initials
  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      {/* Promo Banner */}
      <PromoBanner />
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-background/90 backdrop-blur-lg border-b border-border/50 transition-all duration-300" style={{ top: isMounted ? bannerHeight : '0px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={32} 
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold text-primary" suppressHydrationWarning>
              Saro 2
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 rounded-lg px-3 py-2"
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">Home</span>
            </Link>

            {/* Generate dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105  rounded-lg px-3 py-2">
                <Play className="w-4 h-4" />
                <span className="font-medium">Generate</span>
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={8} className="w-80 p-2 rounded-xl bg-popover border border-border shadow-xl">
                <DropdownMenuItem asChild>
                  <Link href="/sora2-storyboard" className="group flex gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-accent-foreground/10">
                      <Clapperboard className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Storyboard</span>
                      <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">Multi-scene video, up to 25s</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/text-to-video" className="group flex gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-accent-foreground/10">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Text to Video</span>
                      <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">Type a prompt, get a video</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/image-to-video" className="group flex gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-accent-foreground/10">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Image to Video</span>
                      <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">Turn a still into motion</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/watermark-remover" className="group flex gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-accent-foreground/10">
                      <Eraser className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Sora2 Watermark Remover</span>
                      <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">Clean Sora watermark from videos</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/plans"
              className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 rounded-lg px-3 py-2"
            >
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">Pricing</span>
            </Link>

            <Link
              href="/blog"
              className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 rounded-lg px-3 py-2"
            >
              <BookOpen className="w-4 h-4" />
              <span className="font-medium">Blog</span>
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 hover:bg-muted/50 transition-colors rounded-full px-2 py-1"
                  >
                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {getUserInitials()}
                    </div>
                    {/* User Name */}
                    <span className="text-sm font-medium text-foreground hidden sm:block">
                      {getUserDisplayName()}
                    </span>
                    {/* Dropdown Arrow */}
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center space-x-2 p-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {getUserInitials()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{getUserDisplayName()}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/account')}>
                    <User className="w-4 h-4 mr-2" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Preferences
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover-lift"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Save current path for redirect after login
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
                    }
                    setIsAuthModalOpen(true);
                  }}
                >
                  <User className="w-4 h-4 mr-1" />
                  Sign In
                </Button>
                <Button
                  variant="cyber"
                  size="sm"
                  className=""
                  onClick={() => {
                    if (isAuthenticated) {
                      router.push('/text-to-video');
                    } else {
                      // Save current path for redirect after login
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('redirectAfterLogin', '/text-to-video');
                      }
                      setIsAuthModalOpen(true);
                    }
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button and theme toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors duration-300 px-2 py-1">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <div className="px-2 pt-2">
                <div className="text-xs text-muted-foreground pb-1">Generate</div>
                <div className="flex flex-col">
                  <Link href="/sora2-storyboard" className="px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Storyboard</Link>
                  <Link href="/text-to-video" className="px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Text to Video</Link>
                  <Link href="/image-to-video" className="px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Image to Video</Link>
                  <Link href="/watermark-remover" className="px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Sora2 Watermark Remover</Link>
                </div>
              </div>
              <Link href="/plans" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors duration-300 px-2 py-1">
                <DollarSign className="w-4 h-4" />
                <span>Pricing</span>
              </Link>
              <Link href="/blog" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors duration-300 px-2 py-1">
                <BookOpen className="w-4 h-4" />
                <span>Blog</span>
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                {/* Mobile Theme Toggle */}
                <div className="flex justify-center pb-2">
                  <ThemeToggle />
                </div>
                
                {isAuthenticated ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/account')}
                    >
                      <User className="w-4 h-4 mr-1" />
                      Account
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => signOut()}
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Save current path for redirect after login
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
                        }
                        setIsAuthModalOpen(true);
                      }}
                    >
                      <User className="w-4 h-4 mr-1" />
                      Sign In
                    </Button>
                    <Button
                      variant="gradient"
                      size="sm"
                      onClick={() => {
                        if (isAuthenticated) {
                          router.push('/text-to-video');
                        } else {
                          // Save current path for redirect after login
                          if (typeof window !== 'undefined') {
                            sessionStorage.setItem('redirectAfterLogin', '/text-to-video');
                          }
                          setIsAuthModalOpen(true);
                        }
                      }}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
        {/* Auth Modal */}
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </nav>
    </>
  );
};

export default Navigation;

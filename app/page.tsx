"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Hero from '@/components/home/Hero'
import KeyFeatures from '@/components/home/KeyFeatures'
import Testimonials from '@/components/home/Testimonials'
import HowItWorks from '@/components/home/HowItWorks'
import DemoGallery from '@/components/home/DemoGallery'
import PricingTeaser from '@/components/home/PricingTeaser'
import FaqTeaser from '@/components/home/FaqTeaser'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

function ErrorHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 检查 URL 中的错误参数
    const error = searchParams?.get('error');
    const errorDescription = searchParams?.get('error_description');
    const hashParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.hash.substring(1)) : null;
    const hashError = hashParams?.get('error');
    const hashErrorDescription = hashParams?.get('error_description');

    const isDatabaseError = 
      (error === 'server_error' && errorDescription?.includes('Database error saving new user')) ||
      (hashError === 'server_error' && hashErrorDescription?.includes('Database error saving new user'));

    if (isDatabaseError) {
      // 尝试修复：检查用户是否已登录但缺少 users 表记录
      const fixUserRecord = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            console.log('🔧 Attempting to fix missing user record for:', session.user.email);
            
            // 检查 users 表中是否存在记录
            const { data: existingUser, error: fetchError } = await supabase
              .from('users')
              .select('id')
              .eq('id', session.user.id)
              .single();

            // 如果用户不存在，尝试创建
            if (fetchError?.code === 'PGRST116' || !existingUser) {
              console.log('📝 Creating missing user record...');
              
              const { error: createError } = await supabase
                .from('users')
                .insert({
                  id: session.user.id,
                  email: session.user.email,
                  full_name: session.user.user_metadata?.full_name || session.user.email,
                  subscription_plan: 'free',
                  subscription_status: 'active',
                  credits_balance: 3,
                  credits_total: 3,
                  credits_spent: 0,
                  credits_limit: 50,
                });

              if (createError) {
                console.error('❌ Failed to create user record:', createError);
                // 如果客户端创建失败，可能需要服务端 API
                try {
                  const response = await fetch('/api/users/fix-missing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: session.user.id }),
                  });
                  
                  if (!response.ok) {
                    console.error('❌ API fix also failed');
                  }
                } catch (apiError) {
                  console.error('❌ API fix request failed:', apiError);
                }
              } else {
                console.log('✅ User record created successfully');
              }
            }

            // 创建 user_subscriptions 记录（如果不存在）
            const { data: existingSub, error: subFetchError } = await supabase
              .from('user_subscriptions')
              .select('user_id')
              .eq('user_id', session.user.id)
              .single();

            if (subFetchError?.code === 'PGRST116' || !existingSub) {
              console.log('📝 Creating missing subscription record...');
              await supabase
                .from('user_subscriptions')
                .insert({ user_id: session.user.id });
            }

            // 清除 URL 中的错误参数并刷新
            const cleanUrl = window.location.pathname;
            router.replace(cleanUrl);
            
            // 刷新页面以重新加载用户数据
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        } catch (error) {
          console.error('❌ Error fixing user record:', error);
        }
      };

      fixUserRecord();
    }
  }, [searchParams, router]);

  return null;
}

export default function HomePage() {

  useEffect(() => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Sora 2 Video Generator | Sora 2 Alternative',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      description: 'Sora 2 AI video generator, Sora 2 alternative. Create cinematic videos using Sora 2-style AI technology. Text-to-video, image-to-video, multi-scene storyboard. Saro2.ai is an independent platform providing Sora 2-quality video generation services.',
      url: 'https://saro2.ai',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Try with credits, paid advanced features available'
      },
      creator: {
        '@type': 'Organization',
        name: 'Saro',
        url: 'https://saro2.ai'
      },
      featureList: [
        'Sora 2 text-to-video generation',
        'Sora 2 image-to-video conversion',
        'Sora 2 multi-scene storyboard builder',
        'Consistent character identity',
        '25-30 second video extension',
        'Ad-ready layouts and templates',
        'Vertical ad generation',
        'Sora 2 watermark removal'
      ],
      keywords: 'sora 2, sora 2 ai, sora 2 video generator, sora 2 text to video, sora 2 online, sora 2 alternative, sora 2 video creator, sora 2 alternative platform'
    }

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://saro2.ai'
        }
      ]
    }

    const videoJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: 'Sora 2 Video Generator Demo',
      description: 'Watch how Sora 2 AI generates cinematic videos from text prompts',
      thumbnailUrl: 'https://saro2.ai/logo.png',
      uploadDate: '2024-01-01T00:00:00Z',
      contentUrl: 'https://saro2.ai',
      embedUrl: 'https://saro2.ai'
    }

    const scripts = [
      { id: 'jsonld-software', data: jsonLd },
      { id: 'jsonld-breadcrumb', data: breadcrumbJsonLd },
      { id: 'jsonld-video', data: videoJsonLd }
    ]

    scripts.forEach(({ id, data }) => {
      if (document.getElementById(id)) return
      const script = document.createElement('script')
      script.id = id
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(data)
      document.head.appendChild(script)
    })
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <ErrorHandler />
      </Suspense>
      <Navigation />
      <main>
        <Hero />
        <DemoGallery />
        <KeyFeatures />
        <Testimonials />
        <HowItWorks />
        {/* Lightweight SEO copy block (non-hero) targeting long-tail queries */}
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-5xl mx-auto text-sm text-muted-foreground leading-relaxed">
            <h2 className="sr-only">Sora 2 AI Video Ads Generator</h2>
            <p>
              Sora 2 AI video ads generator: create multi-scene video ads with consistent characters for TikTok, Shopify, and product promotions. Sora 2 generates{' '}
              <strong className="font-semibold">25+ second AI video ads</strong> with{' '}
              <strong className="font-semibold">consistent character identity</strong> across multiple scenes. Sora 2 is perfect for brand storytelling, product showcases, and vertical social media ads. Experience Sora 2 technology for your video marketing needs.
            </p>
          </div>
        </section>
        <PricingTeaser />
        <FaqTeaser />
      </main>
      <Footer />
    </>
  )
}

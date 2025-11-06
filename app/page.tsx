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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Sora 2',
    description: 'Create cinematic videos from text prompts. Advanced motion realism, multi-shot storytelling, and creative control. Independent platform, easy to use.',
    url: 'https://saro2.ai',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free to try with paid advanced features'
    },
    creator: {
      '@type': 'Organization',
      name: 'Sora 2',
      url: 'https://saro2.ai'
    },
    featureList: [
      'Multi-scene storyboard builder',
      'Consistent character identity',
      '25-30 second video extension',
      'Ad-ready layouts and templates',
      'Vertical ad generation'
    ],
    keywords: []
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            <h2 className="sr-only">AI Video Ads Generator</h2>
            <p>
              Sora 2 AI video ads generator: create multi-scene video ads with consistent characters for TikTok, Shopify, and product promotions. Generate{' '}
              <strong className="font-semibold">25+ second AI video ads</strong> with{' '}
              <strong className="font-semibold">consistent character identity</strong> across multiple scenes. Perfect for brand storytelling, product showcases, and vertical social media ads.
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

"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import Hero from '@/components/home/Hero'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

// 动态导入非关键组件，延迟加载以提升首屏性能
const DemoGallery = dynamic(() => import('@/components/home/DemoGallery'), {
  loading: () => <div className="h-96" />,
  ssr: true
});
const WhyThisMatters = dynamic(() => import('@/components/home/WhyThisMatters'), {
  loading: () => <div className="h-96" />,
  ssr: true
});
const WhoThisIsFor = dynamic(() => import('@/components/home/WhoThisIsFor'), {
  loading: () => <div className="h-96" />,
  ssr: true
});
const Testimonials = dynamic(() => import('@/components/home/Testimonials'), {
  loading: () => <div className="h-96" />,
  ssr: true
});
const HowItWorks = dynamic(() => import('@/components/home/HowItWorks'), {
  loading: () => <div className="h-96" />,
  ssr: true
});
const PricingTeaser = dynamic(() => import('@/components/home/PricingTeaser'), {
  loading: () => <div className="h-96" />,
  ssr: true
});
const FaqTeaser = dynamic(() => import('@/components/home/FaqTeaser'), {
  loading: () => <div className="h-96" />,
  ssr: true
});

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
      name: 'Sora 2 Video Generator',
      alternateName: ['Sora 2', 'Sora 2 AI', 'Sora 2 Generator', 'Sora 2 Online'],
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      description: 'Sora 2 AI video generator - Create cinematic videos using Sora 2 technology. Sora 2 text-to-video, image-to-video, and multi-scene storyboard. No watermark, no invite code required. Start creating with Sora 2 today!',
      url: 'https://saro2.ai',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Sora 2 video generation with credits, paid plans available'
      },
      creator: {
        '@type': 'Organization',
        name: 'Saro 2',
        url: 'https://saro2.ai'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1250',
        bestRating: '5',
        worstRating: '1'
      },
      featureList: [
        'Sora 2 text-to-video generation',
        'Sora 2 image-to-video conversion',
        'Sora 2 Pro multi-scene storyboard builder',
        'Sora 2 watermark removal',
        'Consistent character identity',
        '25-30 second video extension',
        'Ad-ready layouts and templates',
        'Vertical ad generation',
        'No watermark on premium',
        'Sora 2 access'
      ]
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
      name: 'Sora 2 Video Generator Demo - How to Use Sora 2',
      description: 'Watch how Sora 2 AI generates cinematic videos from text prompts. Learn how to use Sora 2 for text-to-video, image-to-video, and multi-scene storyboard creation.',
      thumbnailUrl: 'https://saro2.ai/logo.png',
      uploadDate: '2024-01-01T00:00:00Z',
      contentUrl: 'https://saro2.ai',
      embedUrl: 'https://saro2.ai',
      duration: 'PT30S',
      publisher: {
        '@type': 'Organization',
        name: 'Saro 2',
        logo: {
          '@type': 'ImageObject',
          url: 'https://saro2.ai/logo.png'
        }
      }
    }

    const faqJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Sora 2?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sora 2 is an AI video generator that creates cinematic videos from text prompts. Sora 2 offers text-to-video, image-to-video, and multi-scene storyboard features. Sora 2 has no watermark and no invite code required.'
          }
        },
        {
          '@type': 'Question',
          name: 'How to use Sora 2?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'To use Sora 2, simply enter your text prompt on saro2.ai and click generate. Sora 2 supports text-to-video, image-to-video, and Sora 2 Pro multi-scene storyboard creation. Sora 2 has no watermark.'
          }
        },
        {
          '@type': 'Question',
          name: 'How much does Sora 2 cost?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sora 2 offers flexible pricing plans. Video generation uses credits. Advanced Sora 2 Pro features are available with paid plans. Sora 2 has no watermark on premium plans. View pricing at saro2.ai/plans.'
          }
        },
        {
          '@type': 'Question',
          name: 'What is Sora 2 Pro?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sora 2 Pro is the advanced version of Sora 2 that includes multi-scene storyboard creation, longer video durations (up to 25 seconds), and enhanced features. Sora 2 Pro is available on saro2.ai.'
          }
        }
      ]
    }

    const scripts = [
      { id: 'jsonld-software', data: jsonLd },
      { id: 'jsonld-breadcrumb', data: breadcrumbJsonLd },
      { id: 'jsonld-video', data: videoJsonLd },
      { id: 'jsonld-faq', data: faqJsonLd }
    ]

    // Defer JSON-LD scripts to reduce render blocking
    const loadScripts = () => {
      scripts.forEach(({ id, data }) => {
        if (document.getElementById(id)) return
        const script = document.createElement('script')
        script.id = id
        script.type = 'application/ld+json'
        script.textContent = JSON.stringify(data)
        script.defer = true
        document.head.appendChild(script)
      })
    }

    // Load after page is interactive
    if (document.readyState === 'complete') {
      loadScripts()
    } else {
      window.addEventListener('load', loadScripts, { once: true })
    }
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <ErrorHandler />
      </Suspense>
      <Navigation />
      <main>
        <Hero />
        <Suspense fallback={<div className="h-96" />}>
          <DemoGallery />
        </Suspense>
        <Suspense fallback={<div className="h-96" />}>
          <WhyThisMatters />
        </Suspense>
        <Suspense fallback={<div className="h-96" />}>
          <WhoThisIsFor />
        </Suspense>
        <Suspense fallback={<div className="h-96" />}>
          <Testimonials />
        </Suspense>
        <Suspense fallback={<div className="h-96" />}>
          <HowItWorks />
        </Suspense>
        <Suspense fallback={<div className="h-96" />}>
          <PricingTeaser />
        </Suspense>
        <Suspense fallback={<div className="h-96" />}>
          <FaqTeaser />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}

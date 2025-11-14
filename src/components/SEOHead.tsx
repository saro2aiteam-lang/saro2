"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonical?: string;
  noindex?: boolean;
  keywords?: string;
  image?: string;
}

const SEOHead = ({ 
  title = "Sora 2 AI Video Generator | Text-to-Video with Sora-Level Quality",
  description = "Create cinematic videos from text prompts. Advanced motion realism, multi-shot storytelling, and creative control. Independent platform, easy to use.",
  ogTitle = "Sora 2 AI Video Generator | Text-to-Video with Sora-Level Quality",
  ogDescription = "Create cinematic videos from text prompts. Advanced motion realism, multi-shot storytelling, and creative control. Independent platform, easy to use.",
  canonical,
  noindex = false,
  keywords = "AI video ads, Sora 2 Storyboard, sora 2 storyboard, multi-scene storyboard, consistent characters, 25 second AI video, vertical ad templates, TikTok ad generator, Shopify product video, AI storyboard builder",
  image = "https://saro2.ai/placeholder.svg"
}: SEOHeadProps) => {
  const pathname = usePathname();
  const baseUrl = "https://saro2.ai"; // Replace with your actual domain
  const currentUrl = canonical || `${baseUrl}${pathname}`;

  useEffect(() => {
    // Update title
    document.title = title;

    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', description);
      document.head.appendChild(metaDescription);
    }

    // Update or create meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    } else {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      metaKeywords.setAttribute('content', keywords);
      document.head.appendChild(metaKeywords);
    }

    // Add author meta tag
    let metaAuthor = document.querySelector('meta[name="author"]');
    if (!metaAuthor) {
      metaAuthor = document.createElement('meta');
      metaAuthor.setAttribute('name', 'author');
      metaAuthor.setAttribute('content', 'Sora 2');
      document.head.appendChild(metaAuthor);
    }

    // Add Google Site Verification meta tag
    let googleVerification = document.querySelector('meta[name="google-site-verification"]');
    if (!googleVerification) {
      googleVerification = document.createElement('meta');
      googleVerification.setAttribute('name', 'google-site-verification');
      googleVerification.setAttribute('content', 'RXG1GciT_6Lk-VckDXsTp0wkUZYZfI0RDWy-9D_P-0E');
      document.head.appendChild(googleVerification);
    }

    // Update or create canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', currentUrl);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', currentUrl);
      document.head.appendChild(canonicalLink);
    }

    // Update or create robots meta
    let metaRobots = document.querySelector('meta[name="robots"]');
    const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow';
    if (metaRobots) {
      metaRobots.setAttribute('content', robotsContent);
    } else {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      metaRobots.setAttribute('content', robotsContent);
      document.head.appendChild(metaRobots);
    }

    // Update Open Graph tags
    const updateOGTag = (property: string, content: string) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`);
      if (ogTag) {
        ogTag.setAttribute('content', content);
      } else {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', property);
        ogTag.setAttribute('content', content);
        document.head.appendChild(ogTag);
      }
    };

    updateOGTag('og:title', ogTitle);
    updateOGTag('og:description', ogDescription);
    updateOGTag('og:url', currentUrl);
    updateOGTag('og:type', 'website');
    updateOGTag('og:image', image);
    updateOGTag('og:image:width', '1200');
    updateOGTag('og:image:height', '630');
    updateOGTag('og:site_name', 'Sora 2');
    updateOGTag('og:locale', 'en_US');

    // Update Twitter Card tags
    const updateTwitterTag = (name: string, content: string) => {
      let twitterTag = document.querySelector(`meta[name="${name}"]`);
      if (twitterTag) {
        twitterTag.setAttribute('content', content);
      } else {
        twitterTag = document.createElement('meta');
        twitterTag.setAttribute('name', name);
        twitterTag.setAttribute('content', content);
        document.head.appendChild(twitterTag);
      }
    };

    updateTwitterTag('twitter:title', ogTitle);
    updateTwitterTag('twitter:description', ogDescription);
    updateTwitterTag('twitter:card', 'summary_large_image');
    updateTwitterTag('twitter:image', image);
    updateTwitterTag('twitter:site', '@saro2aiteam');
    updateTwitterTag('twitter:creator', '@saro2aiteam');

    // Add structured data for SEO
    const addStructuredData = () => {
      const existingScript = document.querySelector('#structured-data');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = 'structured-data';
      script.type = 'application/ld+json';
      
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Sora 2",
        "alternateName": ["Sora 2", "saro2.ai", "AI Video Ads", "Sora 2 Storyboard", "Multi-Scene Storyboard"],
        "description": "Create cinematic videos from text prompts. Advanced motion realism, multi-shot storytelling, and creative control. Independent platform, easy to use.",
        "url": baseUrl,
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "Web Browser",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "offers": {
          "@type": "Offer",
          "price": "19",
          "priceCurrency": "USD",
          "priceValidUntil": "2025-12-31",
          "availability": "https://schema.org/InStock",
          "description": "AI video ads generation subscription"
        },
        "creator": {
          "@type": "Organization",
          "name": "Sora 2",
          "url": baseUrl,
          "logo": `${baseUrl}/favicon.ico`
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "1250",
          "bestRating": "5",
          "worstRating": "1"
        },
        "featureList": [
          "Sora 2 Storyboard builder (multi-scene storyboard)",
          "Consistent character identity",
          "25-30 second video extension",
          "Ad-ready layouts and templates",
          "Vertical ad generation",
          "Text to Video Generation",
          "Image to Video Conversion",
          "No Platform Watermark on Premium"
        ],
        "screenshot": `${baseUrl}/placeholder.svg`,
        "video": {
          "@type": "VideoObject",
          "name": "Sora 2 AI Video Ads Tutorial",
          "description": "Learn how to create Sora 2 Storyboard (multi-scene) video ads with consistent characters",
          "thumbnailUrl": `${baseUrl}/placeholder.svg`,
          "uploadDate": "2025-01-01"
        },
        "keywords": keywords
      };

      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    };

    addStructuredData();

  }, [title, description, ogTitle, ogDescription, currentUrl, noindex, keywords, image, baseUrl]);

  return null; // This component doesn't render anything
};

export default SEOHead;

"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

// Country code to flag emoji mapping
const getCountryFlag = (location: string): string => {
  const locationLower = location.toLowerCase();
  
  // Map locations to country codes for flag emoji
  const countryMap: { [key: string]: string } = {
    'uk': '🇬🇧',
    'united kingdom': '🇬🇧',
    'london': '🇬🇧',
    'singapore': '🇸🇬',
    'mexico': '🇲🇽',
    'mexico city': '🇲🇽',
    'south korea': '🇰🇷',
    'korea': '🇰🇷',
    'seoul': '🇰🇷',
    'canada': '🇨🇦',
    'toronto': '🇨🇦',
    'australia': '🇦🇺',
    'sydney': '🇦🇺',
  };

  // Try to find matching country
  for (const [key, flag] of Object.entries(countryMap)) {
    if (locationLower.includes(key)) {
      return flag;
    }
  }

  // Default fallback
  return '🌍';
};

const testimonials = [
  {
    id: 1,
    name: "James Wilson",
    role: "Wedding Videographer",
    location: "London, UK",
    rating: 5,
    review: "The no watermark feature is really helpful for our business. The audio sync works well and helps us create professional-looking videos more efficiently. Our clients appreciate the quality."
  },
  {
    id: 2,
    name: "Marcus Chen",
    role: "SaaS Founder",
    location: "Singapore",
    rating: 5,
    review: "Great tool for creating product demo videos. The realistic audio helps make our videos feel more professional. It's been useful for our marketing efforts and offers good value."
  },
  {
    id: 3,
    name: "Sarah Rodriguez",
    role: "Content Creator",
    location: "Mexico City",
    rating: 5,
    review: "I use this regularly for my content creation. The text-to-video feature is fast and the quality is good. Having no watermarks is important for my work, and the tool has been reliable."
  },
  {
    id: 4,
    name: "David Kim",
    role: "Creative Director",
    location: "Seoul, South Korea",
    rating: 5,
    review: "We use this for various client projects. The rendering speed helps us meet tight deadlines, and the output quality works well for our needs. It's a practical solution for our agency."
  },
  {
    id: 5,
    name: "Lisa Wang",
    role: "Product Designer",
    location: "Toronto, Canada",
    rating: 5,
    review: "The image-to-video feature is useful for turning concept sketches into visual presentations. It saves time in our design process and helps us communicate ideas to clients more effectively."
  },
  {
    id: 6,
    name: "Alex Johnson",
    role: "Online Educator",
    location: "Sydney, Australia",
    rating: 5,
    review: "I use this to create educational content for my courses. The natural audio sync helps make explanations clearer, and it's been a helpful addition to my content creation workflow."
  }
];

const Testimonials = () => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-yellow-400'
            : i < rating
            ? 'text-yellow-400 fill-yellow-400/50'
            : 'text-gray-300'
        }`}
      />
    ));
  };


  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
            Loved by <span className="text-primary">creators worldwide</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Join creators worldwide who use Sora 2 for AI video generation. 
            See what users say about our platform watermark-free videos and rendering features. Discover why Sora 2 is trusted by creators using Sora 2 technology.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {testimonials.map((testimonial) => (
            <Card 
              key={testimonial.id}
              className="p-6 sm:p-7 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm"
            >
              {/* Avatar and Rating */}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow text-2xl">
                  {getCountryFlag(testimonial.location)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-2">
                    {renderStars(testimonial.rating)}
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-0.5">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {testimonial.location}
                  </p>
                </div>
              </div>

              {/* Review Text */}
              <blockquote className="text-muted-foreground leading-relaxed text-sm sm:text-base relative pl-0">
                <span className="text-2xl text-primary/20 absolute -left-1 -top-2 font-serif">"</span>
                <span className="relative z-10">{testimonial.review}</span>
              </blockquote>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-br from-primary/5 via-primary/3 to-background rounded-3xl p-10 sm:p-12 border border-primary/10">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">
            Join creators making videos with AI
          </h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-base sm:text-lg">
            Experience AI video generation with watermark-free videos, audio features, 
            and efficient rendering. Start creating videos today.
          </p>
          <Button 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            onClick={() => window.location.href = '/text-to-video'}
          >
            Start Creating Now
          </Button>
        </div>

        {/* SEO-Optimized Footer Text */}
        <div className="mt-16 text-center">
          <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-4xl mx-auto">
            Creators use Sora 2 for AI video generation. Features include watermark-free videos, 
            audio synchronization, and efficient rendering. Whether you need text to video, 
            image to video, or are looking for video generation tools, Sora 2 offers 
            video creation capabilities. Create AI-generated videos with Sora 2 audio features, 
            Sora 2 quality options, and Sora 2 commercial use licensing. Sora 2 provides everything you need for professional video creation with Sora 2 technology.
          </p>
        </div>

        {/* Disclaimer for testimonials */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/50 max-w-3xl mx-auto">
            User testimonials reflect individual experiences, results may vary. Saro2.ai is an independent platform, not affiliated with OpenAI's Sora 2.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

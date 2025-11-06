"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: "Emma Thompson",
    role: "Wedding Videographer",
    location: "London, UK",
    rating: 5,
    avatar: "ET",
    review: "Switched from Runway and never looked back. No watermark saved us hundreds in licensing fees, and the audio sync is so natural our clients think we hired professional voice actors. Render times cut our production workflow by 60%."
  },
  {
    id: 2,
    name: "Marcus Chen",
    role: "SaaS Founder",
    location: "Singapore",
    rating: 5,
    avatar: "MC",
    review: "Game-changer for product demos. The realistic audio makes our AI videos feel completely professional. 40% boost in conversion rates, and it's way more affordable than other Sora alternatives. HD quality is unmatched."
  },
  {
    id: 3,
    name: "Sarah Rodriguez",
    role: "Content Creator",
    location: "Mexico City",
    rating: 5,
    avatar: "SR",
    review: "I create 5-10 videos daily. Sora 2's speed and quality are unmatched. Text-to-video intros in minutes, zero watermarks means full monetization. This is the tool I wish existed 2 years ago."
  },
  {
    id: 4,
    name: "David Kim",
    role: "Creative Director",
    location: "Seoul, South Korea",
    rating: 5,
    avatar: "DK",
    review: "Our agency handles 50+ campaigns monthly. Fast renders let us hit impossible deadlines, and clients can't tell it's AI-generated. Professional quality without the enterprise price tag."
  },
  {
    id: 5,
    name: "Lisa Wang",
    role: "Product Designer",
    location: "Toronto, Canada",
    rating: 5,
    avatar: "LW",
    review: "Product mockups went from days to minutes. Image-to-video transforms concept sketches into stunning visuals instantly. No watermark = complete creative freedom for client presentations."
  },
  {
    id: 6,
    name: "Alex Johnson",
    role: "Online Educator",
    location: "Sydney, Australia",
    rating: 5,
    avatar: "AJ",
    review: "Teaching 10,000+ students requires engaging content at scale. Sora2's natural audio sync makes complex explanations feel conversational. Best ROI for course creation tools."
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
            Join 10,000+ creators who trust Sora 2 for professional AI video generation. 
            See what real users say about our no watermark, fast render technology.
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
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                  <span className="text-primary font-bold text-base">
                    {testimonial.avatar}
                  </span>
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
            Join 10,000+ creators making stunning videos
          </h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-base sm:text-lg">
            Experience AI video generation with no watermark, realistic audio, 
            and lightning-fast render times. Start creating professional videos today.
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
            Join over 10,000 creators using Sora 2 for AI video generation. Our users love 
            the no watermark feature, realistic audio synchronization, and fast render times. 
            Whether you need text to video, image to video, or looking for the best 
            Sora alternative, Sora 2 delivers professional results at affordable prices. 
            Create stunning AI-generated videos today with automatic audio, HD quality, 
            and commercial licensing included.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

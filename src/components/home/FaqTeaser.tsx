"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExternalLink } from 'lucide-react';

const faqs = [
  {
    id: 'item-1',
    question: 'What makes Saro 2 different from other AI video generators?',
    answer: 'Sora 2 specializes in multi-scene video ads with consistent characters. While other tools generate 10-second single shots, we create 25+ second narratives perfect for TikTok, Shopify, and product promos. Our storyboard builder lets you control continuity, maintain character identity across scenes, and produce ad-ready content with templates.'
  },
  {
    id: 'item-2',
    question: 'How does character consistency work across multiple scenes?',
    answer: 'Our multi-scene storyboard feature maintains appearance, clothing, and hairstyle consistency across all scenes in your video. This is essential for brand storytelling, mascot videos, and product demos where the same character appears in different settings.'
  },
  {
    id: 'item-3',
    question: 'Can I create videos longer than 10 seconds?',
    answer: 'Yes. Sora 2 supports 25-30 second video generation through our storyboard mode. This addresses a major market pain point, allowing you to create longer-form video ads that actually convert, not just short clips.'
  },
  {
    id: 'item-5',
    question: 'Can I use the generated videos for commercial advertising?',
    answer: 'Yes. Videos generated with Sora 2 can be used for commercial projects, including TikTok ads, Shopify product videos, and social media campaigns. You own the rights to videos you create, subject to our acceptable use policy.'
  },
  {
    id: 'item-6',
    question: 'Do videos have watermarks?',
    answer: 'Premium plans include no watermark downloads. This ensures your video ads are professional and ready for commercial use without any branding from our platform.'
  },
  {
    id: 'item-7',
    question: 'If I make a payment, will my payment information be safe?',
    answer: 'Absolutely. We use secure, trusted payment platforms and banks. Your payment is fully protected, and no personal information will ever be exposed or leaked.'
  },
  {
    id: 'item-8',
    question: 'Are there any hidden charges?',
    answer: 'No, the price displayed is the total amount you\'ll pay. There are no additional hidden fees. Annual plans save up to 50% compared to monthly billing.'
  },

];

const FaqTeaser = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Frequently asked <span className="text-primary">questions</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Get answers to common questions about Sora 2 AI Video Ads
          </p>
        </div>

        {/* FAQ Accordion */}
        <Card className="p-8">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq) => (
              <AccordionItem 
                key={faq.id} 
                value={faq.id}
                className="border border-border/50 rounded-lg px-6 py-2 data-[state=open]:bg-muted/50"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pt-2 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-6">
            Have more questions? We're here to help.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              variant="outline"
              onClick={() => {
                // Future: Navigate to /faq page
                console.log('Navigate to FAQ page');
              }}
            >
              View All FAQs
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
            
            <Button 
              variant="ghost"
              onClick={() => {
                // Future: Open contact/support
                console.log('Contact support');
              }}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqTeaser;
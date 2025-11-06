import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sora 2 FAQ – Frequently Asked Questions',
  description: 'Find answers about Sora 2 video generation, features, availability, and safety controls.',
}

const faqs = [
  { 
    q: 'What is Sora 2?', 
    a: 'Sora 2 is an advanced video + audio generation model, designed to be more physically accurate, realistic, and controllable than prior systems. It also features synchronized dialogue and sound effects.' 
  },
  { 
    q: 'What are the core advantages of Sora 2?', 
    a: 'Sora 2 offers physical realism with better physics respect, higher controllability for intricate instructions, audio-video synchronization, cameo/likeness insertion capabilities, and flexible style support.' 
  },
  { 
    q: 'Does Sora 2 generate both video and audio?', 
    a: 'Yes. Sora 2 is a unified video-audio generation system that can create dialogues, ambient soundscapes, and sound effects in sync with the visuals.' 
  },
  { 
    q: 'How does synchronized dialogue work?', 
    a: 'Sora 2 aligns generated dialogue and sound effects with character lip movements, scene timing, and camera cuts, ensuring coherent voice, motion, and cut transitions.' 
  },
  
  { 
    q: 'Can I control the style and tone?', 
    a: 'Yes. Sora 2 supports various styles (realistic, cinematic, anime, etc.) and can follow instructions across shots to maintain consistent tone and look.' 
  },
  { 
    q: 'Will Sora 2 make errors?', 
    a: 'Yes, it\'s not perfect. Mistakes often resemble internal-agent errors rather than broken visuals, which is seen as progress in better simulating reality.' 
  },
  { 
    q: 'Where is Sora 2 available?', 
    a: 'Sora 2 is available via the Sora iOS app in the U.S. and Canada initially, with plans to expand to additional countries and provide web/API access.' 
  },
  
  {
    q: 'Can I use for commercial advertising?',
    a: 'Yes. Videos generated with Sora 2 can be used for commercial projects, including TikTok ads, Shopify product videos, and social media campaigns. You own the rights to videos you create, subject to our acceptable use policy.'
  },
  {
    q: 'Do videos have watermarks?',
    a: 'Premium plans include no platform watermark downloads. Your exported AI videos include no platform-added marks and are ready for commercial use. "No Watermark" refers only to watermarks added by this platform. We do not support removing watermarks from copyrighted or stock footage. Not for removing third-party or stock provider watermarks.'
  },
  {
    q: 'If I make a payment, will my payment information be safe?',
    a: 'Absolutely. We use secure, trusted payment platforms and banks. Your payment is fully protected, and no personal information will ever be exposed or leaked.'
  },
  {
    q: 'Are there any hidden charges?',
    a: 'No, the price displayed is the total amount you\'ll pay. There are no additional hidden fees.'
  },
  {
    q: 'Is Saro2 affiliated with Sora 2?',
    a: 'No. Saro2.ai is a completely independent AI video generation platform with no affiliation, partnership, or authorization relationship with OpenAI\'s Sora 2. We provide Sora 2-style video generation services using our own technology stack. We use the term "Sora 2" only for descriptive and comparative purposes to help users understand our service positioning. Saro2.ai is an independent platform inspired by similar next-generation video workflows.'
  },
  {
    q: 'Do I need editing experience?',
    a: 'No. Simply enter prompts to generate cinematic videos.'
  },
  {
    q: 'Can I try free credits?',
    a: 'Yes. You can start generating immediately.'
  },
  {
    q: 'What is the relationship between Saro2.ai and OpenAI\'s Sora 2?',
    a: 'Saro2.ai is a completely independent AI video generation platform with no affiliation, partnership, or authorization relationship with OpenAI\'s Sora 2. We provide Sora 2-style video generation services using our own technology. We use the term "Sora 2" only for descriptive and comparative purposes to help users understand our service positioning. "Sora 2" is a registered trademark of OpenAI, and all trademarks belong to their respective owners.'
  }
]

export default function FAQPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    }))
  }
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-3xl font-bold mb-6">Sora 2 Video Generation — Frequently Asked Questions</h1>
      <ul className="space-y-6">
        {faqs.map((f, i) => (
          <li key={i}>
            <h2 className="text-xl font-semibold mb-1">{f.q}</h2>
            <p className="text-muted-foreground">{f.a}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}


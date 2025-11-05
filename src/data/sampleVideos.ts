// Sample videos to showcase Sora 2 capabilities
// These are shown to users before they sign up/generate

export interface SampleVideo {
  id: string;
  prompt: string;
  videoUrl: string;
  thumbnailUrl?: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  duration: number;
  tags: string[];
}

export const sampleVideos: SampleVideo[] = [
  {
    id: 'sample-sushi-chef',
    prompt: 'A master sushi chef expertly preparing nigiri in a traditional Japanese restaurant. Close-up shots of precise knife work cutting fresh salmon. Rice being molded with practiced hands. Elegant presentation on wooden serving board. Natural window lighting with clean aesthetic. ASMR-style detail focus.',
    videoUrl: 'https://lwugseurlnaogrjjlbqj.supabase.co/storage/v1/object/public/showcase-videos/sample.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=450&fit=crop',
    aspectRatio: '16:9',
    duration: 8,
    tags: ['food', 'sushi', 'asmr']
  }
];

// Get a random sample video
export function getRandomSampleVideo(): SampleVideo {
  const randomIndex = Math.floor(Math.random() * sampleVideos.length);
  return sampleVideos[randomIndex];
}

// Get sample video by ID
export function getSampleVideoById(id: string): SampleVideo | undefined {
  return sampleVideos.find(v => v.id === id);
}

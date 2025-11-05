"use client";

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useSubscription } from '@/hooks/useSubscription';
import watermarkApi from '@/services/watermarkApi';
import { AlertTriangle, Play } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthModal from '@/components/AuthModal';
import SubscriptionRequiredModal from '@/components/SubscriptionRequiredModal';
import { getRandomSampleVideo, type SampleVideo } from '@/data/sampleVideos';
import { Sparkles } from 'lucide-react';
import InsufficientCreditsDialog from '@/components/insufficient-credits-dialog';

const WatermarkRemover: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { subscription } = useCredits();
  const { hasActiveSubscription } = useSubscription();

  const [videoUrl, setVideoUrl] = useState('https://sora.chatgpt.com/p/s_68e83bd7eee88191be79d2ba7158516f');
  const [outputUrl, setOutputUrl] = useState<string | undefined>(undefined);
  const [jobId, setJobId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [pendingCost, setPendingCost] = useState<number | undefined>(undefined);
  
  // Sample video state
  const [sampleVideo, setSampleVideo] = useState<SampleVideo | null>(null);
  const [showingSample, setShowingSample] = useState(false);

  const credits = subscription?.credits || 0;

  const isValid = useMemo(() => /^https:\/\/sora\.chatgpt\.com\//.test(videoUrl.trim()), [videoUrl]);

  // Load sample video on mount
  useEffect(() => {
    const sample = getRandomSampleVideo();
    setSampleVideo(sample);
    setShowingSample(true);
  }, []);

  const handleRun = useCallback(async () => {
    setError(undefined);
    setOutputUrl(undefined);

    if (!isAuthenticated) { setShowAuthModal(true); return; }
    if (!hasActiveSubscription) { setShowSubModal(true); return; }
    if (!isValid) {
      setError('Enter a valid Sora URL starting with https://sora.chatgpt.com/.');
      return;
    }

    // Pre-check: requires 10 credits
    if ((subscription?.credits || 0) < 10) { 
      setPendingCost(10); 
      setShowBalanceDialog(true); 
      return; 
    }

    setIsRunning(true);
    try {
      const res = await watermarkApi.create(videoUrl);
      setJobId(res.jobId);
      // poll using existing status endpoint
      const poll = async () => {
        const resp = await fetch(`/api/kie/status/${res.jobId}`, { headers: { 'Authorization': `Bearer ${(await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token}` }, cache: 'no-store' });
        if (!resp.ok) {
          throw new Error(`Status HTTP ${resp.status}`);
        }
        const data = await resp.json();
        if (data.status === 'completed' && data.video_url) {
          setOutputUrl(data.video_url);
          setIsRunning(false);
          return;
        }
        setTimeout(poll, 2000);
      };
      setTimeout(poll, 1500);
    } catch (e: any) {
      const msg = e?.message || '';
      if (/HTTP\s*402/.test(msg) || /Insufficient\s*credits/i.test(msg)) {
        setPendingCost(10);
        setShowBalanceDialog(true);
      } else {
        setError(msg || 'Failed to start task');
      }
      setIsRunning(false);
    }
  }, [isAuthenticated, hasActiveSubscription, isValid, videoUrl]);

  const seoDesc = 'Sora2 watermark remover: remove Sora watermarks from Sora-hosted videos in seconds. Commercial use, API-ready, works with public sora.chatgpt.com links.';

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Sora2 Watermark Remover | Remove Sora Watermarks"
        description={seoDesc}
        canonical="https://saro2.ai/watermark-remover"
        keywords="sora2 watermark remover,Sora watermark remover,remove watermark sora,watermark removal Sora2"
      />
      <Navigation />

      <div className="pt-20 pb-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Sora2 Watermark Remover</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">Remove the Sora watermark from your Sora-hosted videos. Paste a public `sora.chatgpt.com` URL and run. Typical processing takes 1–3 seconds on the API.</p>
          </header>

          {error && (
            <div className="mb-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-bold text-foreground uppercase tracking-wide">Input</span>
                  <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">Credits: {credits}</span>
                </div>

                <label className="block text-sm font-medium text-foreground mb-2">video_url</label>
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://sora.chatgpt.com/p/..."
                  className={`w-full px-4 py-3 rounded-xl border bg-background ${isValid ? 'border-border' : 'border-red-500'}`}
                />
                <p className="text-xs text-muted-foreground mt-2">Must be publicly accessible and start with `https://sora.chatgpt.com/`.</p>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => { setVideoUrl(''); setOutputUrl(undefined); setError(undefined); }}
                    className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted"
                  >Reset</button>
                  <button
                    onClick={handleRun}
                    disabled={isRunning || !isValid}
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {isRunning ? (
                      <span className="inline-flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Running…</span>
                    ) : (
                      <span className="inline-flex items-center gap-2"><Play className="w-4 h-4" /> Run 10credits</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-bold text-foreground uppercase tracking-wide">Output</span>
                  <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">video</span>
                </div>

                {outputUrl ? (
                  <div className="aspect-video bg-muted rounded-xl overflow-hidden">
                    <video className="w-full h-full object-cover" controls src={outputUrl}>
                      <source src={outputUrl} />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : showingSample && sampleVideo ? (
                  <div className="space-y-4">
                    <div className="bg-accent/10 border-2 border-accent/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-accent" />
                        <span className="font-bold text-accent-foreground/80">Example Video</span>
                      </div>
                      <p className="text-sm text-accent-foreground/80">
                        This is a sample video generated by Sora 2 AI. Upload your own Sora video to remove watermarks!
                      </p>
                    </div>
                    
                    <div className="aspect-video bg-muted rounded-xl overflow-hidden">
                      <video 
                        className="w-full h-full object-cover"
                        controls
                        poster={sampleVideo.thumbnailUrl}
                        src={sampleVideo.videoUrl}
                        preload="metadata"
                      >
                        <source src={sampleVideo.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {sampleVideo.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="text-xs px-3 py-1 bg-muted text-muted-foreground rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                    {isRunning ? 'Processing…' : jobId ? 'Waiting for result…' : 'No output yet'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 mb-8">
            <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-4 text-center">
              <p className="text-sm">This tool consumes 10 credits per run. Keep your Sora2 videos clean and brand-ready.</p>
            </div>
          </div>

          {/* Documentation block (paraphrased, keyword‑focused) */}
          <section className="mt-10 mb-16">
            <h2 className="text-2xl font-bold mb-6">Sora2 Watermark Remover Documentation</h2>

            {/* Intro */}
            {/* removed intro hero row */}

            {/* Feature rows */}
            <div className="grid md:grid-cols-2 gap-10 items-start mb-12">
              <div>
                <h3 className="text-lg font-semibold">Intelligent Detection in Sora2 Watermark Remover</h3>
                <p className="text-muted-foreground mt-2">
                  The <strong>sora2 watermark remover</strong> detects and tracks static or moving overlays with AI. It pinpoints logos, text and stickers, then reconstructs pixels so colors, motion, and structure stay true to the original.
                </p>
              </div>
              <figure className="bg-card border border-border rounded-xl overflow-hidden">
                <img src="https://lwugseurlnaogrjjlbqj.supabase.co/storage/v1/object/public/showcase-videos/4.webp" alt="sora2 watermark remover intelligent detection" className="w-full h-auto" loading="lazy" />
              </figure>
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-start mb-12">
              <figure className="bg-card border border-border rounded-xl overflow-hidden order-2 md:order-1">
                <img src="https://lwugseurlnaogrjjlbqj.supabase.co/storage/v1/object/public/showcase-videos/2.webp" alt="sora2 watermark remover frame consistent output" className="w-full h-auto" loading="lazy" />
              </figure>
              <div className="order-1 md:order-2">
                <h3 className="text-lg font-semibold">Remove Watermark with Frame‑Consistent Output</h3>
                <p className="text-muted-foreground mt-2">
                  With motion‑aware tracking, the <strong>sora2 watermark remover</strong> preserves flow and lighting balance. Your clips stay smooth and stable without flicker—ready for export or re‑edit.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-start mb-12">
              <div>
                <h3 className="text-lg font-semibold">Seamless Restoration and Audio Sync</h3>
                <p className="text-muted-foreground mt-2">
                  Using AI reconstruction, the <strong>sora2 watermark remover</strong> fills removed regions naturally, restoring textures and color while keeping audio perfectly in sync for clean, high‑quality Sora videos.
                </p>
              </div>
              <figure className="bg-card border border-border rounded-xl overflow-hidden">
                <img src="https://lwugseurlnaogrjjlbqj.supabase.co/storage/v1/object/public/showcase-videos/3.webp" className="w-full h-auto" loading="lazy" />
              </figure>
            </div>

            {/* What you can remove */}
            <h3 className="text-3xl sm:text-4xl font-bold text-center mb-4">What You Can Remove Using Sora2 Watermark Remover</h3>
            <p className="text-xl text-muted-foreground text-center mb-10">Capabilities of the <strong>sora2 watermark remover</strong></p>
            <div className="grid md:grid-cols-2 gap-8 mb-14">
              <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-3">Sora 2</div>
                <h4 className="text-xl font-semibold mb-2">Remove Watermark from Sora 2 Video</h4>
                <p className="text-muted-foreground">AI tracking clears moving or static overlays while the <strong>sora2 watermark remover</strong> keeps motion smooth and natural.</p>
              </div>
              <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-3">Sora 2 Pro</div>
                <h4 className="text-xl font-semibold mb-2">Remove Watermark from Sora 2 Pro Video</h4>
                <p className="text-muted-foreground">Optimized for 1080p/cinematic outputs, the <strong>sora2 watermark remover</strong> handles embedded or semi‑transparent overlays.</p>
              </div>
            </div>

            {/* Why remove */}
            <h3 className="text-3xl sm:text-4xl font-bold text-center mb-4">Why remove watermarks</h3>
            <p className="text-xl text-muted-foreground text-center mb-10">Benefits of using the <strong>sora2 watermark remover</strong></p>
            <div className="grid md:grid-cols-3 gap-8 mb-14">
              <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-3">Professional</div>
                <h4 className="text-xl font-semibold mb-2">Create Clean, Professional Videos</h4>
                <p className="text-muted-foreground">The <strong>sora2 watermark remover</strong> removes visual noise so clips look polished for marketing, social, and presentations.</p>
              </div>
              <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-3">Editing</div>
                <h4 className="text-xl font-semibold mb-2">Prepare Clips for Editing & Reuse</h4>
                <p className="text-muted-foreground">Start with a clean base—transitions, grading, and effects work better after the <strong>sora2 watermark remover</strong> pass.</p>
              </div>
              <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-3">Workflow</div>
                <h4 className="text-xl font-semibold mb-2">Integrate with AI Workflows</h4>
                <p className="text-muted-foreground">Consistent, watermark‑free outputs make it easy to chain the <strong>sora2 watermark remover</strong> with other AI tools.</p>
              </div>
            </div>

            {/* How to remove for free */}
            <h3 className="text-3xl sm:text-4xl font-bold text-center mb-4">How to remove for free</h3>
            <p className="text-xl text-muted-foreground text-center mb-10">Three easy steps with the <strong>sora2 watermark remover</strong></p>
            <div className="grid md:grid-cols-3 gap-8 mb-14">
              <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mb-4">1</div>
                <h4 className="text-xl font-semibold mb-2">Paste your Sora URL</h4>
                <p className="text-muted-foreground">Open the playground and paste your video link; the <strong>sora2 watermark remover</strong> prepares it for AI detection.</p>
              </div>
              <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mb-4">2</div>
                <h4 className="text-xl font-semibold mb-2">Generate</h4>
                <p className="text-muted-foreground">Click once— the <strong>sora2 watermark remover</strong> detects and removes logos/text across frames.</p>
              </div>
              <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mb-4">3</div>
                <h4 className="text-xl font-semibold mb-2">Download & integrate</h4>
                <p className="text-muted-foreground">Preview and save the clean clip; integrate the <strong>sora2 watermark remover</strong> into your workflow.</p>
              </div>
            </div>

            {/* Use cases */}
            <h3 className="text-3xl sm:text-4xl font-bold text-center mb-4">Use cases</h3>
            <p className="text-xl text-muted-foreground text-center mb-10">Where the <strong>sora2 watermark remover</strong> fits</p>
            <div className="grid md:grid-cols-3 gap-8 mb-14">
              <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all"><h4 className="text-xl font-semibold mb-2">Publish clean AI videos</h4><p className="text-muted-foreground">Use the <strong>sora2 watermark remover</strong> before posting to social, YouTube, or portfolios.</p></div>
              <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all"><h4 className="text-xl font-semibold mb-2">Editing & remix</h4><p className="text-muted-foreground">A clean base from the <strong>sora2 watermark remover</strong> avoids artifacts in transitions and effects.</p></div>
              <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all"><h4 className="text-xl font-semibold mb-2">Automated pipelines</h4><p className="text-muted-foreground">Developers can batch clips through the <strong>sora2 watermark remover</strong> for consistent results.</p></div>
            </div>

            {/* FAQ list removed to avoid duplication with accordion below */}
          </section>

          {/* FAQ styled like homepage */}
          <section className="py-16 bg-muted/30 rounded-2xl">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold mb-3">Frequently asked <span className="text-primary">questions</span></h2>
                <p className="text-xl text-muted-foreground">Quick answers about the <strong>sora2 watermark remover</strong></p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="divide-y divide-border">
                  <details className="group py-3">
                    <summary className="cursor-pointer font-semibold group-open:text-primary">How do I remove the watermark from a Sora video?</summary>
                    <div className="text-muted-foreground pt-2">Open the playground, paste the URL, click Generate—the <strong>sora2 watermark remover</strong> does the rest.</div>
                  </details>
                  <details className="group py-3">
                    <summary className="cursor-pointer font-semibold group-open:text-primary">Can I use it for free?</summary>
                    <div className="text-muted-foreground pt-2">Yes—try the <strong>sora2 watermark remover</strong> with free credits after sign‑up.</div>
                  </details>
                  <details className="group py-3">
                    <summary className="cursor-pointer font-semibold group-open:text-primary">Does it support Sora 2 Pro videos?</summary>
                    <div className="text-muted-foreground pt-2">Yes, the <strong>sora2 watermark remover</strong> handles semi‑transparent overlays in Pro outputs.</div>
                  </details>
                  <details className="group py-3">
                    <summary className="cursor-pointer font-semibold group-open:text-primary">What types of watermarks can be removed?</summary>
                    <div className="text-muted-foreground pt-2">Logos, text, and overlays—static or moving—via the <strong>sora2 watermark remover</strong>.</div>
                  </details>
                  <details className="group py-3">
                    <summary className="cursor-pointer font-semibold group-open:text-primary">Does removal affect quality?</summary>
                    <div className="text-muted-foreground pt-2">The <strong>sora2 watermark remover</strong> uses reconstruction to keep texture and motion consistent.</div>
                  </details>
                  <details className="group py-3">
                    <summary className="cursor-pointer font-semibold group-open:text-primary">Can I integrate it into my workflow?</summary>
                    <div className="text-muted-foreground pt-2">Yes—call the API directly or chain Sora 2 + <strong>sora2 watermark remover</strong>.</div>
                  </details>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />

      {/* Modals */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <SubscriptionRequiredModal isOpen={showSubModal} onClose={() => setShowSubModal(false)} />
      <InsufficientCreditsDialog
        open={showBalanceDialog}
        onOpenChange={setShowBalanceDialog}
        requiredCredits={pendingCost ?? 10}
        availableCredits={subscription?.credits || 0}
        onRequestAuth={() => setShowAuthModal(true)}
      />
    </div>
  );
};

export default WatermarkRemover;



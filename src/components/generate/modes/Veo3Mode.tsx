import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Veo3Params } from '@/types/generation-modes';
import { Play, Info, Upload, X, Sparkles, Wand2, Maximize2, Square } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Veo3ModeProps {
  params: Veo3Params;
  onChange: (params: Veo3Params) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onModelChange?: (model: 'sora2' | 'veo3.1') => void;
}

export const Veo3Mode: React.FC<Veo3ModeProps> = ({
  params,
  onChange,
  onGenerate,
  isGenerating,
  onModelChange
}) => {
  const [imageUrls, setImageUrls] = useState<string[]>(params.imageUrls || []);

  // Sync imageUrls with params when params change externally
  React.useEffect(() => {
    if (params.imageUrls) {
      setImageUrls(params.imageUrls);
    } else {
      setImageUrls([]);
    }
  }, [params.imageUrls]);

  const handleAddImageUrl = () => {
    const url = prompt('Enter image URL:');
    if (url && url.trim()) {
      const newUrls = [...imageUrls, url.trim()];
      setImageUrls(newUrls);
      onChange({ ...params, imageUrls: newUrls });
    }
  };

  const handleRemoveImageUrl = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    onChange({ ...params, imageUrls: newUrls.length > 0 ? newUrls : undefined });
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
    onChange({ ...params, imageUrls: newUrls });
  };

  // Auto-determine generationType based on imageUrls
  const updateGenerationType = (urls: string[]) => {
    let newGenerationType: Veo3Params['generationType'] = 'TEXT_2_VIDEO';
    if (urls.length === 1) {
      newGenerationType = 'FIRST_AND_LAST_FRAMES_2_VIDEO';
    } else if (urls.length >= 2) {
      newGenerationType = 'FIRST_AND_LAST_FRAMES_2_VIDEO';
    } else if (urls.length >= 1 && urls.length <= 3) {
      // Could be REFERENCE_2_VIDEO if user wants, but default to FIRST_AND_LAST_FRAMES_2_VIDEO
      newGenerationType = 'REFERENCE_2_VIDEO';
    }
    if (newGenerationType !== params.generationType) {
      onChange({ ...params, generationType: newGenerationType });
    }
  };

  React.useEffect(() => {
    if (imageUrls.length > 0) {
      updateGenerationType(imageUrls);
    } else {
      onChange({ ...params, generationType: 'TEXT_2_VIDEO' });
    }
  }, [imageUrls.length]);

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-6">
        {/* Prompt */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            Generation prompt <span className="text-destructive">*</span>
          </Label>
          <Textarea
            placeholder="A keyboard whose keys are made of different types of candy. Typing makes sweet, crunchy sounds. Audio: Crunchy, sugary typing sounds, delighted giggles."
            value={params.prompt}
            onChange={(e) => onChange({ ...params, prompt: e.target.value })}
            className="min-h-[120px] resize-none border-input focus:border-primary focus:ring-primary"
          />
        </div>

        {/* Image URLs - Only show when images are added */}
        {imageUrls.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-foreground">Image URLs</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Image URLs info"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs leading-relaxed">
                    For FIRST_AND_LAST_FRAMES_2_VIDEO: 1-2 images
                    For REFERENCE_2_VIDEO: 1-3 images (Fast model, 16:9 only)
                    Images must be accessible public URLs
                  </TooltipContent>
                </Tooltip>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddImageUrl}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Add Image URL
              </Button>
            </div>
            {imageUrls.length > 0 && (
              <div className="space-y-2">
                {imageUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={url}
                      onChange={(e) => handleImageUrlChange(index, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveImageUrl(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {imageUrls.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No images added. Click "Add Image URL" to add reference images.
              </p>
            )}
          </div>
        )}

        {/* Aspect Ratio */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-foreground">Ratio</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Ratio info"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">
                16:9: Landscape format, supports 1080P HD (only 16:9 supports 1080P)
                9:16: Portrait format for mobile videos
                Auto: Automatically matches aspect ratio based on uploaded image
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={params.aspectRatio === 'Auto' ? 'default' : 'outline'}
              onClick={() => onChange({ ...params, aspectRatio: 'Auto' })}
              className={`flex-1 h-10 text-sm font-medium ${
                params.aspectRatio === 'Auto' 
                  ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                  : 'border-input text-foreground hover:bg-muted'
              }`}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Auto
            </Button>
            <Button
              variant={params.aspectRatio === '16:9' ? 'default' : 'outline'}
              onClick={() => onChange({ ...params, aspectRatio: '16:9' })}
              className={`flex-1 h-10 text-sm font-medium ${
                params.aspectRatio === '16:9' 
                  ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                  : 'border-input text-foreground hover:bg-muted'
              }`}
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              16:9
            </Button>
            <Button
              variant={params.aspectRatio === '9:16' ? 'default' : 'outline'}
              onClick={() => onChange({ ...params, aspectRatio: '9:16' })}
              className={`flex-1 h-10 text-sm font-medium ${
                params.aspectRatio === '9:16' 
                  ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                  : 'border-input text-foreground hover:bg-muted'
              }`}
            >
              <Square className="w-4 h-4 mr-2" />
              9:16
            </Button>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-3 border-t pt-4">
          <Label className="text-sm font-medium text-foreground">Advanced Options</Label>
          
          {/* Seeds */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Seed (Optional)</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Seed info"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">
                  Random seed (10000-99999). Same seed generates similar content.
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="number"
              value={params.seeds || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                if (value === undefined || (value >= 10000 && value <= 99999)) {
                  onChange({ ...params, seeds: value });
                }
              }}
              placeholder="please input seed"
              min={10000}
              max={99999}
              className="w-full"
            />
          </div>

          {/* Enable Translation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Enable Translation</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Enable Translation info"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">
                  Automatically translate prompts to English for better generation results
                </TooltipContent>
              </Tooltip>
            </div>
            <Button
              type="button"
              variant={params.enableTranslation !== false ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange({ ...params, enableTranslation: !params.enableTranslation })}
              className="h-8"
            >
              {params.enableTranslation !== false ? 'On' : 'Off'}
            </Button>
          </div>

          {/* Watermark */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Watermark (Optional)</Label>
            <Input
              value={params.watermark || ''}
              onChange={(e) => onChange({ ...params, watermark: e.target.value || undefined })}
              placeholder="MyBrand"
              className="w-full"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button 
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-shadow duration-200"
            onClick={onGenerate}
            disabled={isGenerating || !params.prompt}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                <span className="mr-2">60</span>
                Generate
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            According to google, audio is an experimental feature and may be unavailable on some videos.{' '}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Audio info"
                  className="text-muted-foreground underline transition-colors hover:text-foreground"
                >
                  ?
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">
                Google's Veo 3.1 includes audio generation by default, but in some cases (e.g., sensitive content involving minors) audio may be suppressed.
              </TooltipContent>
            </Tooltip>
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
};


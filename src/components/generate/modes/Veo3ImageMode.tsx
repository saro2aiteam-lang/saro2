import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ReframeParams } from '@/types/generation-modes';
import { Sparkles, Wand2, Maximize2, Square, Info, X, Upload as UploadIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Veo3ImageModeProps {
  params: ReframeParams;
  onChange: (params: ReframeParams) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onModelChange?: (model: 'sora2' | 'veo3.1') => void;
}

const Veo3ImageMode: React.FC<Veo3ImageModeProps> = ({
  params,
  onChange,
  onGenerate,
  isGenerating,
  onModelChange
}) => {
  const handleStartFrameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange({ ...params, startFrame: file });
    }
  };

  const handleEndFrameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange({ ...params, endFrame: file });
    }
  };

  const removeStartFrame = () => {
    onChange({ ...params, startFrame: undefined });
  };

  const removeEndFrame = () => {
    onChange({ ...params, endFrame: undefined });
  };

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-6">
        {/* Image Upload Section - Start Frame and End Frame */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            Image <span className="text-destructive">*</span>
          </Label>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Start Frame */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Start Frame</Label>
              <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 text-center hover:border-primary transition-colors relative">
                {params.startFrame ? (
                  <div className="space-y-2">
                    <div className="relative mx-auto h-24 w-full overflow-hidden rounded-lg border border-border">
                      <img
                        src={URL.createObjectURL(params.startFrame)}
                        alt="Start frame"
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                      <button
                        onClick={removeStartFrame}
                        className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background transition-colors"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{params.startFrame.name}</p>
                  </div>
                ) : (
                  <label className="block cursor-pointer space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleStartFrameChange}
                    />
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UploadIcon className="h-5 w-5" />
                    </div>
                    <p className="text-xs text-muted-foreground">Upload Start Frame</p>
                  </label>
                )}
              </div>
            </div>

            {/* End Frame */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">End Frame</Label>
              <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 text-center hover:border-primary transition-colors relative">
                {params.endFrame ? (
                  <div className="space-y-2">
                    <div className="relative mx-auto h-24 w-full overflow-hidden rounded-lg border border-border">
                      <img
                        src={URL.createObjectURL(params.endFrame)}
                        alt="End frame"
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                      <button
                        onClick={removeEndFrame}
                        className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background transition-colors"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{params.endFrame.name}</p>
                  </div>
                ) : (
                  <label className="block cursor-pointer space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEndFrameChange}
                    />
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UploadIcon className="h-5 w-5" />
                    </div>
                    <p className="text-xs text-muted-foreground">Upload End Frame</p>
                  </label>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Drag and drop or click to upload your image
          </p>
          <p className="text-xs text-muted-foreground">
            Supported formats: JPG, JPEG, PNG; each file max 10MB
          </p>
        </div>

        {/* Generation Prompt */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            Generation prompt <span className="text-destructive">*</span>
          </Label>
          <Textarea
            placeholder='The camera performs a smooth 180-degree arc shot, starting with the front-facing view of the singer and circling around her to seamlessly end on the POV shot from behind her on stage. The singer sings "when you look me in the eyes, I can see a million stars."'
            value={params.prompt || ''}
            onChange={(e) => onChange({ ...params, prompt: e.target.value })}
            className="min-h-[120px] resize-none border-input focus:border-primary focus:ring-primary"
          />
        </div>

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
              variant={params.targetAspectRatio === 'Auto' ? 'default' : 'outline'}
              onClick={() => onChange({ ...params, targetAspectRatio: 'Auto' })}
              className={`flex-1 h-10 text-sm font-medium ${
                params.targetAspectRatio === 'Auto' 
                  ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                  : 'border-input text-foreground hover:bg-muted'
              }`}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Auto
            </Button>
            <Button
              variant={params.targetAspectRatio === '16:9' ? 'default' : 'outline'}
              onClick={() => onChange({ ...params, targetAspectRatio: '16:9' })}
              className={`flex-1 h-10 text-sm font-medium ${
                params.targetAspectRatio === '16:9' 
                  ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                  : 'border-input text-foreground hover:bg-muted'
              }`}
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              16:9
            </Button>
            <Button
              variant={params.targetAspectRatio === '9:16' ? 'default' : 'outline'}
              onClick={() => onChange({ ...params, targetAspectRatio: '9:16' })}
              className={`flex-1 h-10 text-sm font-medium ${
                params.targetAspectRatio === '9:16' 
                  ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                  : 'border-input text-foreground hover:bg-muted'
              }`}
            >
              <Square className="w-4 h-4 mr-2" />
              9:16
            </Button>
          </div>
        </div>

        {/* Seed (Optional) */}
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

        {/* Generate Button */}
        <div className="space-y-3 pt-4">
          <Button 
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={onGenerate}
            disabled={isGenerating || !params.prompt || (!params.startFrame && !params.endFrame)}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                <span className="mr-2">250</span>
                Generate
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};

export { Veo3ImageMode };
export default Veo3ImageMode;

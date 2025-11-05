import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ReframeParams } from '@/types/generation-modes';
import { RotateCcw, Play, Upload as UploadIcon, Lightbulb, Sparkles, CircleHelp, Image as ImageIcon, Info, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { imagePromptCategories, getImageExamplesByCategory } from '@/data/promptExamples';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ReframeModeProps {
  params: ReframeParams;
  onChange: (params: ReframeParams) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const ReframeMode: React.FC<ReframeModeProps> = ({
  params,
  onChange,
  onGenerate,
  isGenerating
}) => {
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange({ ...params, sourceVideo: file });
    }
  };

  const handleSelectExample = (prompt: string, aspectRatio?: '9:16' | '16:9') => {
    onChange({
      ...params,
      prompt,
      ...(aspectRatio ? { targetAspectRatio: aspectRatio } : {}),
    });
    setIsExamplesOpen(false);
  };

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-4">
        {/* Prompt Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-foreground">Prompt *</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Prompt info"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">
                  Describe the motion you want to create from the reference image
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isExamplesOpen} onOpenChange={setIsExamplesOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <Lightbulb className="w-4 h-4" />
                    AI Examples
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      Image-to-Video Prompt Examples
                    </DialogTitle>
                  </DialogHeader>

                  <Tabs defaultValue={imagePromptCategories[0]} className="w-full">
                    <TabsList className="!flex flex-wrap gap-2 justify-start !h-auto p-2 bg-muted/70">
                      {imagePromptCategories.map(category => (
                    <TabsTrigger
                          key={category}
                          value={category}
                      className="text-xs px-3 py-2 !whitespace-normal leading-snug text-center rounded-md min-h-[2.75rem] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          {category}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {imagePromptCategories.map(category => (
                      <TabsContent key={category} value={category} className="mt-4">
                        <div className="grid gap-3">
                          {getImageExamplesByCategory(category).map(example => (
                            <Card
                              key={example.id}
                              className="p-4 hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary"
                              onClick={() => handleSelectExample(example.prompt, example.aspectRatio)}
                            >
                              <div className="space-y-3">
                                <div className="text-sm font-medium text-foreground">
                                  {example.title}
                                </div>
                                <div className="text-xs text-muted-foreground leading-relaxed">
                                  {example.prompt}
                                </div>
                                <Button
                                  size="sm"
                                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectExample(example.prompt, example.aspectRatio);
                                  }}
                                >
                                  Use This Prompt
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </DialogContent>
              </Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10"
                    aria-label="Open Prompt GPT"
                    onClick={() =>
                      window.open(
                        "https://chatgpt.com/g/g-68e177451b608191847c35c6a1b4a5bf-ai-video-prompt-director",
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  >
                    <Sparkles className="w-4 h-4" />
                    Prompt GPT
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">
                  Need inspiration? Brainstorm camera moves, story beats, and audio cues with the AI Video Prompt GPT, then paste the upgraded prompt here.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <textarea
            placeholder="Describe the motion you want to create. For example: 'A gentle zoom in on the sushi chef's hands as they carefully shape the rice, with soft focus on the background'"
            value={params.prompt || ''}
            onChange={(e) => onChange({ ...params, prompt: e.target.value })}
            className="w-full min-h-[80px] rounded-xl border border-input bg-card/50 p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>

        {/* Image Upload Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-foreground">Reference Image *</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Reference Image info"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">
                Upload one reference image or video (JPG, PNG, WEBP, MP4, MOV up to 10MB) that will be used as the opening frame.
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary transition-colors">
            {params.sourceVideo ? (
              <div className="space-y-2">
                <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-xl border border-border">
                  <img
                    src={URL.createObjectURL(params.sourceVideo)}
                    alt="Uploaded image"
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{params.sourceVideo.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(params.sourceVideo.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChange({ ...params, sourceVideo: undefined as any })}
                  className="border-input text-foreground hover:bg-muted"
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> 
                  Change Image
                </Button>
              </div>
            ) : (
              <label className="block cursor-pointer space-y-2">
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Upload Reference File</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Drag and drop an image or video here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports JPG, PNG, WEBP, MP4, MOV up to 10MB
                  </p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-3 md:grid-cols-2">
          {/* Aspect Ratio */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-foreground">Aspect Ratio</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Aspect Ratio info"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">
                  Select the target aspect ratio for the generated video output.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={params.targetAspectRatio === '9:16' ? 'default' : 'outline'}
                onClick={() => onChange({ ...params, targetAspectRatio: '9:16' })}
                className={`flex-1 h-9 text-sm font-medium ${
                  params.targetAspectRatio === '9:16' 
                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                    : 'border-input text-foreground hover:bg-muted'
                }`}
              >
                Portrait
              </Button>
              <Button
                variant={params.targetAspectRatio === '16:9' ? 'default' : 'outline'}
                onClick={() => onChange({ ...params, targetAspectRatio: '16:9' })}
                className={`flex-1 h-9 text-sm font-medium ${
                  params.targetAspectRatio === '16:9' 
                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                    : 'border-input text-foreground hover:bg-muted'
                }`}
              >
                Landscape
              </Button>
            </div>
          </div>

        </div>

        {/* Generate Button */}
        <Button 
          className="w-full h-10 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={onGenerate}
          disabled={isGenerating || !params.prompt || !params.sourceVideo}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Generating Video...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Generate · 30 Credits
            </>
          )}
        </Button>
      </div>
    </TooltipProvider>
  );
};

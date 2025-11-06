import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sora2Params } from '@/types/generation-modes';
import { Wand2, Video, LayoutPanelTop, Sparkles, Clock, Maximize2, Settings2, Lightbulb, Play, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { promptExamples, promptCategories, getExamplesByCategory } from '@/data/promptExamples';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Sora2ModeProps {
  params: Sora2Params;
  onChange: (params: Sora2Params) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const Sora2Mode: React.FC<Sora2ModeProps> = ({
  params,
  onChange,
  onGenerate,
  isGenerating
}) => {
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);

  const handleSelectExample = (prompt: string, aspectRatio?: '9:16' | '16:9') => {
    onChange({ 
      ...params, 
      prompt,
      ...(aspectRatio && { aspectRatio })
    });
    setIsExamplesOpen(false);
  };

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-6">
      {/* Prompt */}
      <div className="space-y-3">
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
                The text prompt describing the desired video motion
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
                    AI-Generated Video Prompt Examples
                  </DialogTitle>
                  <DialogDescription>
                    Browse example prompts to inspire your video generation
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue={promptCategories[0]} className="w-full">
                  <TabsList className="!flex flex-wrap gap-2 justify-start !h-auto p-2 bg-muted/70">
                    {promptCategories.map(category => (
                      <TabsTrigger 
                        key={category} 
                        value={category}
                        className="text-xs px-3 py-2 !whitespace-normal leading-snug text-center rounded-md min-h-[2.75rem] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        {category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {promptCategories.map(category => (
                    <TabsContent key={category} value={category} className="mt-4">
                      <div className="grid gap-3">
                        {getExamplesByCategory(category).map(example => (
                          <Card 
                            key={example.id}
                            className="p-4 hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary"
                            onClick={() => handleSelectExample(example.prompt, example.aspectRatio)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                                  {example.title}
                                  {example.aspectRatio && (
                                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                                      {example.aspectRatio}
                                    </span>
                                  )}
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                  {example.prompt}
                                </p>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="shrink-0 text-primary hover:text-primary/90 hover:bg-primary/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectExample(example.prompt, example.aspectRatio);
                                }}
                              >
                                Use
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
                      "https://chatgpt.com/g/g-690c3e49fb308191aa623c67543a766a-sarogpt-ai-video-prompt-script-assistant",
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
        <Textarea
          placeholder="A master sushi chef expertly preparing nigiri in a traditional Japanese restaurant..."
          value={params.prompt}
          onChange={(e) => onChange({ ...params, prompt: e.target.value })}
          className="min-h-[120px] resize-none border-input focus:border-primary focus:ring-primary"
        />
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-3">
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
              This parameter defines the aspect ratio of the image.
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={params.aspectRatio === '9:16' ? 'default' : 'outline'}
            onClick={() => onChange({ ...params, aspectRatio: '9:16' })}
            className={`flex-1 h-9 text-sm font-medium ${
              params.aspectRatio === '9:16' 
                ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                : 'border-input text-foreground hover:bg-muted'
            }`}
          >
            Portrait
          </Button>
          <Button
            variant={params.aspectRatio === '16:9' ? 'default' : 'outline'}
            onClick={() => onChange({ ...params, aspectRatio: '16:9' })}
            className={`flex-1 h-9 text-sm font-medium ${
              params.aspectRatio === '16:9' 
                ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                : 'border-input text-foreground hover:bg-muted'
            }`}
          >
            Landscape
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        <Button 
          variant="outline" 
          className="flex-1 h-11 border-input text-foreground hover:bg-muted font-medium"
        >
          Reset
        </Button>
        <Button 
          className="flex-[2] h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
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
              <Play className="w-4 h-4 mr-2" />
              Generate · 30 Credits
            </>
          )}
        </Button>
      </div>
    </div>
    </TooltipProvider>
  );
};

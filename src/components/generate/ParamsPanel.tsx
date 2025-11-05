import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { AspectRatio, Duration } from '@/types/jobs';
import { Clock, Ratio, Settings } from 'lucide-react';

interface ParamsPanelProps {
  duration: Duration;
  setDuration: (value: Duration) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (value: AspectRatio) => void;
  cfgScale: number;
  setCfgScale: (value: number) => void;
  disabled?: boolean;
}

const ParamsPanel: React.FC<ParamsPanelProps> = ({
  duration,
  setDuration,
  aspectRatio,
  setAspectRatio,
  cfgScale,
  setCfgScale,
  disabled = false
}) => {
  const handleCfgScaleChange = (values: number[]) => {
    setCfgScale(values[0]);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Generation Parameters</h3>
        </div>

        {/* Duration */}
        <div>
          <Label className="text-sm font-medium flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Duration</span>
          </Label>
          <Select 
            value={duration.toString()} 
            onValueChange={(value) => setDuration(parseInt(value) as Duration)}
            disabled={disabled}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8">8 seconds</SelectItem>
              <SelectItem value="12">12 seconds</SelectItem>
              <SelectItem value="16">16 seconds</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-foreground/70 dark:text-muted-foreground mt-1">
            Longer videos consume more credits
          </p>
        </div>

        {/* Aspect Ratio */}
        <div>
          <Label className="text-sm font-medium flex items-center space-x-2">
            <Ratio className="w-4 h-4" />
            <span>Aspect Ratio</span>
          </Label>
          <Select 
            value={aspectRatio} 
            onValueChange={(value) => setAspectRatio(value as AspectRatio)}
            disabled={disabled}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">
                <div className="flex items-center justify-between w-full">
                  <span>16:9</span>
                  <span className="text-xs text-muted-foreground ml-2">Landscape</span>
                </div>
              </SelectItem>
              <SelectItem value="9:16">
                <div className="flex items-center justify-between w-full">
                  <span>9:16</span>
                  <span className="text-xs text-muted-foreground ml-2">Portrait</span>
                </div>
              </SelectItem>
              <SelectItem value="1:1">
                <div className="flex items-center justify-between w-full">
                  <span>1:1</span>
                  <span className="text-xs text-muted-foreground ml-2">Square</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* CFG Scale (Guidance Strength) */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Guidance Strength</Label>
            <span className="text-sm text-muted-foreground">{cfgScale}</span>
          </div>
          <div className="mt-3 mb-2">
            <Slider
              value={[cfgScale]}
              onValueChange={handleCfgScaleChange}
              min={0}
              max={10}
              step={0.5}
              disabled={disabled}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Less strict</span>
            <span>More strict</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Higher values follow your prompt more closely
          </p>
        </div>

        {/* Visual Aspect Ratio Preview */}
        <div>
          <Label className="text-sm font-medium">Preview</Label>
          <div className="mt-2 flex justify-center">
            <div className="bg-muted rounded-lg p-4">
              <div
                className={`bg-primary/20 border border-primary/30 rounded ${
                  aspectRatio === '16:9'
                    ? 'w-16 h-9'
                    : aspectRatio === '9:16'
                    ? 'w-9 h-16'
                    : 'w-12 h-12'
                }`}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {aspectRatio === '16:9' && 'Great for landscapes and cinematic scenes'}
            {aspectRatio === '9:16' && 'Perfect for mobile and social media'}
            {aspectRatio === '1:1' && 'Ideal for social posts and avatars'}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ParamsPanel;
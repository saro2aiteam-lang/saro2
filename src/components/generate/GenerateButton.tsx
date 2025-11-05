import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Clock, Zap, AlertTriangle } from 'lucide-react';
import { Duration, AspectRatio } from '@/types/jobs';

interface GenerateButtonProps {
  prompt: string;
  duration: Duration;
  aspectRatio: AspectRatio;
  onGenerate: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  userCredits?: number;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({
  prompt,
  duration,
  aspectRatio,
  onGenerate,
  disabled = false,
  isGenerating = false,
  userCredits = 0
}) => {
  // Calculate cost estimate based on duration (simple formula)
  const calculateCostEstimate = (): number => {
    const baseCost = duration; // Base cost = duration in seconds
    
    // Aspect ratio multiplier (16:9 is standard, others might cost more)
    const aspectMultiplier = aspectRatio === '16:9' ? 1.0 : 1.1;
    
    return Math.ceil(baseCost * aspectMultiplier);
  };

  const costEstimate = calculateCostEstimate();
  const canAfford = userCredits >= costEstimate;
  const canSubmit = prompt.trim().length > 0 && !disabled && !isGenerating;

  const getButtonText = () => {
    if (isGenerating) {
      return 'Generating...';
    }
    return `Generate (预计消耗：${costEstimate} 秒)`;
  };

  const getButtonIcon = () => {
    if (isGenerating) {
      return <Clock className="w-4 h-4 mr-2 animate-spin" />;
    }
    return <Play className="w-4 h-4 mr-2" />;
  };

  return (
    <div className="space-y-4">
      {/* Cost breakdown */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h4 className="font-medium text-sm">Cost Estimate</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-foreground/70 dark:text-muted-foreground">Base cost ({duration}s):</span>
            <span>{duration} credits</span>
          </div>
          {aspectRatio !== '16:9' && (
            <div className="flex justify-between">
              <span className="text-foreground/70 dark:text-muted-foreground">Aspect ratio ({aspectRatio}):</span>
              <span>+{Math.ceil(duration * 0.1)} credits</span>
            </div>
          )}
          <hr className="border-muted" />
          <div className="flex justify-between font-medium">
            <span>Total:</span>
            <span className="flex items-center">
              <Zap className="w-3 h-3 mr-1" />
              {costEstimate} credits
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground/70 dark:text-muted-foreground">
            Available credits: {userCredits}
          </span>
          {canAfford ? (
            <span className="text-green-600">✓ Sufficient balance</span>
          ) : (
            <span className="text-destructive">⚠ Insufficient credits</span>
          )}
        </div>
      </div>

      {/* Empty prompt warning */}
      {!prompt.trim() && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please enter a prompt to generate your video.
          </AlertDescription>
        </Alert>
      )}

      {/* Generate Button */}
      <Button 
        onClick={onGenerate}
        disabled={!canSubmit}
        className="w-full"
        size="lg"
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>

      {/* Disclaimer */}
      <div className="text-xs text-foreground/70 dark:text-muted-foreground space-y-1 border-t pt-4">
        <p className="font-medium">可接受使用政策</p>
        <p>
          严禁使用本服务生成诈骗、仿冒、侵犯版权等违法内容。
        </p>
        <p>
          <strong>品牌声明：</strong>本服务与 Google、Vertex AI、Flow 无从属或官方关系。
        </p>
      </div>
    </div>
  );
};

export default GenerateButton;

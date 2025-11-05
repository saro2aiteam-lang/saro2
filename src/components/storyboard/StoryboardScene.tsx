import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Trash2, 
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { StoryboardShot } from '@/types/storyboard';
import { cn } from '@/lib/utils';

interface StoryboardSceneComponentProps {
  shot: StoryboardShot;
  index: number;
  onUpdate: (shot: StoryboardShot) => void;
  onDelete: () => void;
  maxDuration: number;
  remainingDuration: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const StoryboardSceneComponent: React.FC<StoryboardSceneComponentProps> = ({
  shot,
  index,
  onUpdate,
  onDelete,
  maxDuration,
  remainingDuration,
  isCollapsed = false,
  onToggleCollapse
}) => {
  // Local state for duration input to allow free editing
  const [localDuration, setLocalDuration] = useState(shot.duration.toString());
  
  // Sync external duration changes
  useEffect(() => {
    setLocalDuration(shot.duration.toString());
  }, [shot.duration]);
  
  const handlePromptChange = (prompt: string) => {
    onUpdate({ ...shot, prompt });
  };

  const handleDurationChange = (duration: number[]) => {
    const newDuration = duration[0];
    if (newDuration <= remainingDuration + shot.duration) {
      onUpdate({ ...shot, duration: newDuration });
    }
  };

  return (
    <Card className="p-4 border-border hover:border-primary/50 transition-colors">
      <div className="space-y-4">
        {/* Shot Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">
                Shot {index + 1}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{shot.duration}s</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="h-8 w-8 p-0"
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <div className="space-y-4">
            {/* Prompt */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Shot Description</Label>
              <Textarea
                placeholder="Describe what happens in this shot..."
                value={shot.prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Duration Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Duration</Label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={Math.min(maxDuration, remainingDuration + shot.duration)}
                  value={localDuration}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocalDuration(value); // Allow any input
                    
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue >= 0.1) {
                      // If exceeds maximum, automatically set to maximum
                      const maxAllowed = Math.min(maxDuration, remainingDuration + shot.duration);
                      const finalValue = Math.min(numValue, maxAllowed);
                      handleDurationChange([finalValue]);
                    }
                  }}
                  onBlur={() => {
                    const numValue = parseFloat(localDuration);
                    if (isNaN(numValue) || numValue < 0.1) {
                      // Restore to current valid value
                      setLocalDuration(shot.duration.toString());
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">s</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
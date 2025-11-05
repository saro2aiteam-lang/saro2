import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Code, 
  FileText, 
  Copy, 
  Check,
  AlertTriangle
} from 'lucide-react';
import { StoryboardParams } from '@/types/storyboard';
import { cn } from '@/lib/utils';

interface JSONEditorProps {
  params: StoryboardParams;
  onParamsChange: (params: StoryboardParams) => void;
  onViewToggle: (view: 'form' | 'json') => void;
  currentView: 'form' | 'json';
}

export const JSONEditor: React.FC<JSONEditorProps> = ({
  params,
  onParamsChange,
  onViewToggle,
  currentView
}) => {
  const [jsonString, setJsonString] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Convert params to JSON string
  useEffect(() => {
    try {
      const json = JSON.stringify(params, null, 2);
      setJsonString(json);
      setIsValid(true);
      setError(null);
    } catch (err) {
      setIsValid(false);
      setError('Failed to serialize parameters');
    }
  }, [params]);

  // Validate JSON input
  const validateJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      
      // Basic validation
      if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
        setError('Missing or invalid scenes array');
        return false;
      }
      
      if (!parsed.totalDuration || ![10, 15, 25].includes(parsed.totalDuration)) {
        setError('totalDuration must be 10, 15, or 25');
        return false;
      }
      
      if (!parsed.aspectRatio || !['portrait', 'landscape'].includes(parsed.aspectRatio)) {
        setError('aspectRatio must be "portrait" or "landscape"');
        return false;
      }

      // Validate each scene
      for (const scene of parsed.scenes) {
        if (!scene.id || !scene.prompt || !scene.duration || !scene.order) {
          setError('Each scene must have id, prompt, duration, and order');
          return false;
        }
        
        if (typeof scene.duration !== 'number' || scene.duration < 1) {
          setError('Scene duration must be a number >= 1');
          return false;
        }
      }

      setError(null);
      return true;
    } catch (err) {
      setError('Invalid JSON format');
      return false;
    }
  };

  const handleJSONChange = (value: string) => {
    setJsonString(value);
    const valid = validateJSON(value);
    setIsValid(valid);
  };

  const applyJSON = () => {
    if (isValid && !error) {
      try {
        const parsed = JSON.parse(jsonString);
        onParamsChange(parsed);
      } catch (err) {
        setError('Failed to parse JSON');
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const resetToForm = () => {
    try {
      const json = JSON.stringify(params, null, 2);
      setJsonString(json);
      setIsValid(true);
      setError(null);
    } catch (err) {
      setError('Failed to reset JSON');
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            <Label className="text-lg font-semibold">JSON Editor</Label>
            <Badge variant={isValid ? "default" : "destructive"} className="text-xs">
              {isValid ? "Valid" : "Invalid"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetToForm}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Reset
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewToggle('form')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Form View
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* JSON Textarea */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Storyboard Configuration</Label>
          <Textarea
            value={jsonString}
            onChange={(e) => handleJSONChange(e.target.value)}
            className={cn(
              "min-h-[400px] font-mono text-sm resize-none",
              !isValid && "border-destructive focus:border-destructive"
            )}
            placeholder="Enter JSON configuration..."
          />
        </div>

        {/* Apply Button */}
        <div className="flex justify-end">
          <Button
            onClick={applyJSON}
            disabled={!isValid || !!error}
            className="flex items-center gap-2"
          >
            Apply Changes
          </Button>
        </div>

        {/* JSON Schema Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Expected fields:</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li><code>scenes</code> - Array of scene objects</li>
            <li><code>totalDuration</code> - 10, 15, or 25 seconds</li>
            <li><code>aspectRatio</code> - "portrait" or "landscape"</li>
            <li>Each scene: <code>id</code>, <code>prompt</code>, <code>duration</code>, <code>order</code>, <code>imageUrl</code> (optional)</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

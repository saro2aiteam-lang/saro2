import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormErrors } from '@/types/jobs';

interface PromptFormProps {
  prompt: string;
  setPrompt: (value: string) => void;
  negativePrompt: string;
  setNegativePrompt: (value: string) => void;
  referenceImage: File | null;
  setReferenceImage: (file: File | null) => void;
  errors: FormErrors;
  disabled?: boolean;
  showReferenceImage?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const PromptForm: React.FC<PromptFormProps> = ({
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  referenceImage,
  setReferenceImage,
  errors,
  disabled = false,
  showReferenceImage = true
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please upload a JPG, PNG, or WebP image';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 2MB';
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      // You can add toast notification here
      console.error(error);
      return;
    }
    setReferenceImage(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Prompt */}
      <div>
        <Label htmlFor="prompt" className="text-base font-medium">
          Video Prompt *
        </Label>
        <Textarea
          id="prompt"
          placeholder="Describe the video you want to generate... e.g., 'A cinematic drone shot over Tokyo at night with neon lights reflecting on wet streets'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className={`mt-2 min-h-[120px] resize-none ${errors.prompt ? 'border-destructive' : ''}`}
          maxLength={1000}
          disabled={disabled}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.prompt && (
            <p className="text-sm text-destructive">{errors.prompt}</p>
          )}
          <span className="text-xs text-foreground/70 dark:text-muted-foreground ml-auto">
            {prompt.length}/1000
          </span>
        </div>
      </div>

      {/* Reference Image Upload */}
      {showReferenceImage && (
      <div>
        <Label className="text-base font-medium">
          Reference Image (Optional)
        </Label>
        <div className="mt-2">
          {referenceImage ? (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={URL.createObjectURL(referenceImage)}
                    alt="Reference"
                    className="w-16 h-16 object-cover rounded-lg"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-sm font-medium">{referenceImage.name}</p>
                    <p className="text-xs text-foreground/70 dark:text-muted-foreground">
                      {(referenceImage.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeImage}
                  disabled={disabled}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              } ${errors.reference_image ? 'border-destructive' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8 text-foreground/70 dark:text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-foreground/70 dark:text-muted-foreground mb-2">
                Drag and drop an image or{' '}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-foreground/70 dark:text-muted-foreground">
                JPG, PNG, WebP up to 2MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
                disabled={disabled}
              />
            </div>
          )}
          {errors.reference_image && (
            <p className="text-sm text-destructive mt-1">{errors.reference_image}</p>
          )}
        </div>
      </div>
      )}

      {/* Negative Prompt */}
      <div>
        <Label htmlFor="negative-prompt" className="text-base font-medium">
          Negative Prompt (Optional)
        </Label>
        <Textarea
          id="negative-prompt"
          placeholder="What to avoid in the video... e.g., 'blurry, low quality, distorted, noisy'"
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          className={`mt-2 min-h-[80px] resize-none ${errors.negative_prompt ? 'border-destructive' : ''}`}
          maxLength={300}
          disabled={disabled}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.negative_prompt && (
            <p className="text-sm text-destructive">{errors.negative_prompt}</p>
          )}
          <span className="text-xs text-foreground/70 dark:text-muted-foreground ml-auto">
            {negativePrompt.length}/300
          </span>
        </div>
      </div>
    </div>
  );
};

export default PromptForm;
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import SubscriptionRequiredModal from '@/components/SubscriptionRequiredModal';
import { useSubscription } from '@/hooks/useSubscription';
import { 
  Play, 
  Download, 
  Copy, 
  RotateCcw, 
  X, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Share2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Job } from '@/types/jobs';

interface JobCardProps {
  job: Job;
  onRetry?: (job: Job) => void;
  onCancel?: (jobId: string) => void;
  onCopyParams?: (job: Job) => void;
  onToggleVisibility?: (jobId: string, visibility: 'public' | 'private') => void;
  compact?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  onRetry,
  onCancel,
  onCopyParams,
  onToggleVisibility,
  compact = false
}) => {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { canDownload } = useSubscription();
  const getStatusIcon = () => {
    switch (job.status) {
      case 'PENDING':
      case 'QUEUED':
        return <Clock className="w-4 h-4 text-foreground/70 dark:text-muted-foreground" />;
      case 'RUNNING':
        return <Clock className="w-4 h-4 text-primary animate-spin" />;
      case 'SUCCEEDED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'FAILED':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'CANCELED':
        return <X className="w-4 h-4 text-foreground/70 dark:text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-foreground/70 dark:text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    const variant = job.status === 'SUCCEEDED' 
      ? 'default' 
      : job.status === 'FAILED' 
        ? 'destructive' 
        : 'secondary';
    
    return (
      <Badge variant={variant} className="text-xs">
        {job.status === 'RUNNING' ? `${job.progress}%` : job.status}
      </Badge>
    );
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = () => {
    if (!canDownload) {
      setShowSubscriptionModal(true);
      return;
    }

    if (job.result_url) {
      window.open(job.result_url, '_blank');
    }
  };

  const handleCopyLink = () => {
    if (job.result_url) {
      navigator.clipboard.writeText(job.result_url);
      // Toast notification would go here
    }
  };

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {job.params.prompt}
            </p>
            <div className="flex items-center space-x-4 mt-1 text-xs text-foreground/70 dark:text-muted-foreground">
              <span>{job.params.duration_sec}s</span>
              <span>{job.params.aspect_ratio}</span>
              <span>{job.creditCost ?? 0} credits</span>
              <span>{formatTime(job.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {getStatusBadge()}
            {job.status === 'SUCCEEDED' && job.result_url && (
              <Button size="sm" variant="ghost" onClick={handleDownload}>
                <Download className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium text-sm text-muted-foreground">
              Job {job.jobId.split('_')[1]?.substring(0, 8) || job.jobId.substring(0, 8)}
            </span>
            {getStatusBadge()}
          </div>
          <div className="flex items-center space-x-2">
            {onToggleVisibility && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleVisibility(job.jobId, job.visibility === 'public' ? 'private' : 'public')}
              >
                {job.visibility === 'public' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              {formatTime(job.created_at)}
            </span>
          </div>
        </div>

        {/* Prompt */}
        <div>
          <p className="text-sm leading-relaxed">{job.params.prompt}</p>
          {job.params.negative_prompt && (
            <p className="text-xs text-muted-foreground mt-2">
              <strong>Avoid:</strong> {job.params.negative_prompt}
            </p>
          )}
        </div>

        {/* Parameters */}
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <span>{job.params.duration_sec}s</span>
          <span>{job.params.aspect_ratio}</span>
          <span>CFG: {job.params.cfg_scale}</span>
          <span>{job.creditCost ?? 0} credits</span>
        </div>

        {/* Progress Bar (for running jobs) */}
        {job.status === 'RUNNING' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing...</span>
              <span>{job.progress}%</span>
            </div>
            <Progress value={job.progress} className="w-full" />
            <p className="text-xs text-muted-foreground">
              Estimated time remaining: {Math.ceil((100 - job.progress) / 10)} minutes
            </p>
          </div>
        )}

        {/* Success - Video Player */}
        {job.status === 'SUCCEEDED' && job.result_url && (
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <video
                src={job.result_url}
                controls
                className="w-full h-full"
                poster={job.preview_url}
                preload="metadata"
                loading="lazy"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={handleCopyLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              {onCopyParams && (
                <Button variant="outline" onClick={() => onCopyParams(job)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Params
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Failed - Error Display */}
        {job.status === 'FAILED' && job.error && (
          <div className="space-y-3">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  Generation Failed
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {job.error.message}
              </p>
              {job.error.code && (
                <p className="text-xs text-muted-foreground mt-1">
                  Error Code: {job.error.code}
                </p>
              )}
            </div>
            
            <div className="flex space-x-2">
              {onRetry && (
                <Button onClick={() => onRetry(job)} variant="outline" className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              )}
              {onCopyParams && (
                <Button variant="outline" onClick={() => onCopyParams(job)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Params
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Cancel button for pending/running jobs */}
        {(job.status === 'PENDING' || job.status === 'QUEUED' || job.status === 'RUNNING') && onCancel && (
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onCancel(job.jobId)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Subscription Required Modal */}
      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        feature="download videos"
      />
    </Card>
  );
};

export default JobCard;

"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Play, Clock, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { generationHistoryService, GenerationHistoryItem } from "@/services/generationHistoryService";
import { toast } from "sonner";

interface GenerationHistoryProps {
  className?: string;
}

const GenerationHistory = ({ className }: GenerationHistoryProps) => {
  const [jobs, setJobs] = useState<GenerationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await generationHistoryService.getHistory(50, 0);
      setJobs(response.jobs);
    } catch (err) {
      console.error('Failed to load generation history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (job: GenerationHistoryItem) => {
    if (!job.videoUrl) {
      toast.error('Video not available for download');
      return;
    }

    try {
      setDownloading(job.id);
      await generationHistoryService.downloadVideo(
        job.videoUrl, 
        `video_${job.jobId}.mp4`
      );
      toast.success('Video downloaded successfully');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to download video');
    } finally {
      setDownloading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'queued':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'queued':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncatePrompt = (prompt: string, maxLength: number = 100) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading generation history...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadHistory} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold mb-2">No Generation History</h3>
          <p className="text-muted-foreground">
            You haven't generated any videos yet. Start creating amazing videos!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Generation History</h3>
        <Button onClick={loadHistory} variant="outline" size="sm">
          Refresh
        </Button>
      </div>
      
      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(job.status)}
                  <Badge variant={getStatusBadgeVariant(job.status)}>
                    {job.status}
                  </Badge>
                </div>
                
                <p className="font-medium text-sm mb-2 break-words">
                  {truncatePrompt(job.prompt)}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>{job.duration}s</span>
                  <span>{job.aspectRatio}</span>
                  <span>{job.resolution}</span>
                  <span>{job.model}</span>
                  <span>{formatDate(job.createdAt)}</span>
                </div>
                
                {job.errorMessage && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                    {job.errorMessage}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {job.videoUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(job)}
                    disabled={downloading === job.id}
                  >
                    {downloading === job.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                )}
                
                {job.videoUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(job.videoUrl, '_blank')}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default GenerationHistory;

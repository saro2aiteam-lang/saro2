import { useState, useEffect, useCallback } from 'react';
import { StoryboardJob } from '@/types/storyboard';

interface UseStoryboardPollingProps {
  jobs: StoryboardJob[];
  onJobUpdate: (job: StoryboardJob) => void;
}

export const useStoryboardPolling = ({ jobs, onJobUpdate }: UseStoryboardPollingProps) => {
  const [pollingJobs, setPollingJobs] = useState<Set<string>>(new Set());

  const pollJobStatus = useCallback(async (job: StoryboardJob) => {
    if (!job.taskId) return;

    try {
      const response = await fetch(`/api/storyboard/status?taskId=${job.taskId}`);
      
      if (!response.ok) {
        console.error(`Failed to poll job status for ${job.taskId}`);
        return;
      }

      const statusData = await response.json();
      
      // Update job with new status
      const updatedJob: StoryboardJob = {
        ...job,
        status: statusData.status,
        progress: statusData.progress,
        videoUrl: statusData.videoUrl,
        error: statusData.error,
        kieState: statusData.kieState,
      };

      onJobUpdate(updatedJob);

      // Stop polling if job is completed or failed
      if (statusData.status === 'completed' || statusData.status === 'failed') {
        setPollingJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(job.jobId);
          return newSet;
        });
      }
    } catch (error) {
      console.error(`Error polling job status for ${job.taskId}:`, error);
    }
  }, [onJobUpdate]);

  const startPolling = useCallback((jobId: string) => {
    setPollingJobs(prev => new Set(prev).add(jobId));
  }, []);

  const stopPolling = useCallback((jobId: string) => {
    setPollingJobs(prev => {
      const newSet = new Set(prev);
      newSet.delete(jobId);
      return newSet;
    });
  }, []);

  // Polling effect
  useEffect(() => {
    if (pollingJobs.size === 0) return;

    const interval = setInterval(() => {
      pollingJobs.forEach(jobId => {
        const job = jobs.find(j => j.jobId === jobId);
        if (job && (job.status === 'pending' || job.status === 'processing' || job.status === 'generating')) {
          pollJobStatus(job);
        }
      });
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [pollingJobs, jobs, pollJobStatus]);

  return {
    startPolling,
    stopPolling,
    isPolling: (jobId: string) => pollingJobs.has(jobId),
  };
};

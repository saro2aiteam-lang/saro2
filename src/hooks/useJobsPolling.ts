import { useState, useEffect, useRef, useCallback } from 'react';
import { Job, JobStatus } from '@/types/jobs';
import videoApi from '@/services/videoApi';

interface UseJobsPollingOptions {
  jobs: Job[];
  onJobUpdate: (job: Job) => void;
  pollingInterval?: number; // Base interval in milliseconds
  maxRetries?: number;
  backoffMultiplier?: number;
}

interface PollingState {
  [jobId: string]: {
    retries: number;
    interval: number;
  };
}

const useJobsPolling = ({
  jobs,
  onJobUpdate,
  pollingInterval = 5000, // 5 seconds base - more reasonable for video generation
  maxRetries = 20, // Increased for long-running video generation
  backoffMultiplier = 1.2 // Gentler backoff
}: UseJobsPollingOptions) => {
  const [pollingStates, setPollingStates] = useState<PollingState>({});
  const intervalsRef = useRef<{ [jobId: string]: NodeJS.Timeout }>({});
  
  // Jobs that need polling (not in final states)
  const activeJobs = jobs.filter(job => {
    const status = job.status;
    return status === 'PENDING' || 
           status === 'QUEUED' || 
           status === 'RUNNING';
  });

  // Helper function to check if a job is in final state
  const isJobInFinalState = useCallback((status: JobStatus): boolean => {
    return status === 'SUCCEEDED' || 
           status === 'FAILED' || 
           status === 'CANCELED';
  }, []);

  const stopPolling = useCallback((jobId: string) => {
    if (intervalsRef.current[jobId]) {
      clearInterval(intervalsRef.current[jobId]);
      delete intervalsRef.current[jobId];
    }

    setPollingStates(prev => {
      const { [jobId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const pollJob = useCallback(async (jobId: string) => {
    try {
      if (!jobId || jobId === 'undefined' || jobId === 'null') {
        console.error(`[POLLING] Invalid jobId: ${jobId}`);
        return;
      }
      
      console.log(`[POLLING] Checking status for job: ${jobId}`);
      // Use real video API to get job status
      const updatedJob: Job = await videoApi.getJob(jobId);
      
      console.log(`[POLLING] Job ${jobId} status: ${updatedJob.status}, progress: ${updatedJob.progress}`);
      
      // Reset retry count on successful poll
      setPollingStates(prev => ({
        ...prev,
        [jobId]: {
          ...prev[jobId],
          retries: 0,
          interval: pollingInterval
        }
      }));
      
      onJobUpdate(updatedJob);
      
      // Stop polling if job reached final state
      if (isJobInFinalState(updatedJob.status)) {
        console.log(`[POLLING] Job ${jobId} reached final state: ${updatedJob.status}, stopping polling`);
        // Clear interval directly to avoid circular dependency
        if (intervalsRef.current[jobId]) {
          clearInterval(intervalsRef.current[jobId]);
          delete intervalsRef.current[jobId];
        }
        setPollingStates(prev => {
          const { [jobId]: removed, ...rest } = prev;
          return rest;
        });
      }
      
    } catch (error) {
      console.error(`[POLLING] Failed to poll job ${jobId}:`, error);
      
      setPollingStates(prev => {
        const currentState = prev[jobId] || { retries: 0, interval: pollingInterval };
        const newRetries = currentState.retries + 1;
        
        // Handle 429 (rate limit) errors with longer backoff
        const isRateLimit = error instanceof Error && error.message.includes('429');
        const backoffMultiplierToUse = isRateLimit ? 2.0 : backoffMultiplier;
        
        // Stop polling if max retries reached
        if (newRetries >= maxRetries) {
          console.error(`[POLLING] Max retries reached for job ${jobId} (${newRetries}/${maxRetries})`);
          // Clear interval directly to avoid circular dependency
          if (intervalsRef.current[jobId]) {
            clearInterval(intervalsRef.current[jobId]);
            delete intervalsRef.current[jobId];
          }
          
          // Mark job as failed due to polling failure
          onJobUpdate({
            jobId,
            status: 'FAILED' as JobStatus,
            error: {
              code: 'POLLING_FAILED',
              message: 'Unable to retrieve job status after multiple attempts'
            }
          } as Job);
          
          const { [jobId]: removed, ...rest } = prev;
          return rest;
        }
        
        // Calculate backoff interval with longer delay for rate limits
        const newInterval = Math.min(
          currentState.interval * backoffMultiplierToUse,
          isRateLimit ? 60000 : 30000 // Max 60s for rate limits, 30s for others
        );
        
        console.log(`[POLLING] Backing off job ${jobId} to ${newInterval}ms (retry ${newRetries}/${maxRetries})`);
        
        return {
          ...prev,
          [jobId]: {
            retries: newRetries,
            interval: newInterval
          }
        };
      });
    }
  }, [onJobUpdate, pollingInterval, maxRetries, backoffMultiplier, isJobInFinalState]);

  const startPolling = useCallback((jobId: string) => {
    if (intervalsRef.current[jobId]) {
      clearInterval(intervalsRef.current[jobId]);
    }
    
    const currentState = pollingStates[jobId] || { 
      retries: 0, 
      interval: pollingInterval 
    };
    
    // Poll immediately
    pollJob(jobId);
    
    // Set up interval polling
    intervalsRef.current[jobId] = setInterval(() => {
      pollJob(jobId);
    }, currentState.interval);
    
  }, [pollJob, pollingStates, pollingInterval]);

  const stopAllPolling = useCallback(() => {
    Object.keys(intervalsRef.current).forEach(jobId => {
      if (intervalsRef.current[jobId]) {
        clearInterval(intervalsRef.current[jobId]);
        delete intervalsRef.current[jobId];
      }
    });
    setPollingStates({});
  }, []);

  // Start polling for new active jobs
  useEffect(() => {
    const currentPollingJobIds = Object.keys(intervalsRef.current);
    const activeJobIds = activeJobs.map(job => job.jobId);
    
    // Start polling for new jobs
    activeJobIds.forEach(jobId => {
      if (!currentPollingJobIds.includes(jobId)) {
        console.log(`[POLLING] Starting polling for new job: ${jobId}`);
        startPolling(jobId);
      }
    });
    
    // Stop polling for jobs that are no longer active
    currentPollingJobIds.forEach(jobId => {
      if (!activeJobIds.includes(jobId)) {
        console.log(`[POLLING] Stopping polling for inactive job: ${jobId}`);
        stopPolling(jobId);
      }
    });
    
    // Log current polling status
    if (activeJobIds.length > 0) {
      console.log(`[POLLING] Currently polling ${activeJobIds.length} active jobs:`, activeJobIds);
    }
    
  }, [activeJobs, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllPolling();
    };
  }, [stopAllPolling]);

  // Update polling intervals for jobs with increased retry counts
  useEffect(() => {
    Object.entries(pollingStates).forEach(([jobId, state]) => {
      if (intervalsRef.current[jobId] && state.retries > 0) {
        // Restart with new interval
        clearInterval(intervalsRef.current[jobId]);
        intervalsRef.current[jobId] = setInterval(() => {
          pollJob(jobId);
        }, state.interval);
      }
    });
  }, [pollingStates, pollJob]);

  return {
    activePollingJobs: Object.keys(intervalsRef.current),
    pollingStates,
    startPolling,
    stopPolling,
    stopAllPolling
  };
};

export default useJobsPolling;

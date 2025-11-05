import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import JobCard from './JobCard';
import { Job } from '@/types/jobs';
import { Clock, Play } from 'lucide-react';

interface JobListProps {
  jobs: Job[];
  onRetry?: (job: Job) => void;
  onCancel?: (jobId: string) => void;
  onCopyParams?: (job: Job) => void;
  onToggleVisibility?: (jobId: string, visibility: 'public' | 'private') => void;
  maxHistory?: number;
}

const JobList: React.FC<JobListProps> = ({
  jobs,
  onRetry,
  onCancel,
  onCopyParams,
  onToggleVisibility,
  maxHistory = 10
}) => {
  // Separate running jobs from completed ones
  const runningJobs = jobs.filter(job => 
    job.status === 'PENDING' || 
    job.status === 'QUEUED' || 
    job.status === 'RUNNING'
  );
  
  const completedJobs = jobs
    .filter(job => 
      job.status === 'SUCCEEDED' || 
      job.status === 'FAILED' || 
      job.status === 'CANCELED'
    )
    .slice(0, maxHistory);

  const getStatusSummary = () => {
    const running = runningJobs.length;
    const failed = jobs.filter(job => job.status === 'FAILED').length;
    const succeeded = jobs.filter(job => job.status === 'SUCCEEDED').length;
    
    return { running, failed, succeeded };
  };

  const { running, failed, succeeded } = getStatusSummary();

  if (jobs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Play className="w-16 h-16 text-foreground/70 dark:text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No jobs yet</h3>
        <p className="text-foreground/70 dark:text-muted-foreground">
          Start by writing a prompt.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Job status</h3>
          <div className="flex items-center space-x-4">
            {running > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {running} running
              </Badge>
            )}
            {succeeded > 0 && (
              <Badge variant="default" className="text-xs">
                ✓ {succeeded} completed
              </Badge>
            )}
            {failed > 0 && (
              <Badge variant="destructive" className="text-xs">
                ✗ {failed} failed
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Running Jobs */}
      {runningJobs.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium flex items-center">
            <Clock className="w-4 h-4 mr-2 text-primary" />
            Running jobs
          </h3>
          {runningJobs.map((job) => (
            <JobCard
              key={job.jobId}
              job={job}
              onCancel={onCancel}
              onCopyParams={onCopyParams}
              onToggleVisibility={onToggleVisibility}
            />
          ))}
        </div>
      )}

      {/* Completed Jobs History */}
      {completedJobs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Recent jobs</h3>
            <span className="text-xs text-foreground/70 dark:text-muted-foreground">
              Showing last {Math.min(maxHistory, completedJobs.length)} items
            </span>
          </div>
          
          {completedJobs.map((job, index) => (
            <JobCard
              key={job.jobId}
              job={job}
              onRetry={onRetry}
              onCopyParams={onCopyParams}
              onToggleVisibility={onToggleVisibility}
              compact={index > 2} // Show first 3 in full detail, rest compact
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;
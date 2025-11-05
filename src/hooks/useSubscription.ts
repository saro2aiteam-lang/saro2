import { useCredits } from '@/contexts/CreditsContext';

export const useSubscription = () => {
  const { subscription } = useCredits();

  // Check if user has an active paid subscription
  const hasActiveSubscription = () => {
    if (!subscription) return false;
    
    // Check if subscription is active and not free plan
    return subscription.status === 'active' && 
           subscription.plan && 
           !subscription.plan.includes('free') && 
           subscription.plan !== 'free';
  };

  // Check if user can download videos (requires credits, not necessarily subscription)
  const canDownload = () => {
    // 用户只要有积分就可以下载，不强制要求订阅
    return subscription && subscription.credits > 0;
  };

  return {
    hasActiveSubscription: hasActiveSubscription(),
    canDownload: canDownload(),
    subscription
  };
};

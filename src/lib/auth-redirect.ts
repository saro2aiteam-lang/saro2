import { supabase } from '@/lib/supabase';
import { getRedirectPath } from '@/lib/auth-utils';

/**
 * Handle redirect after successful sign in
 */
export async function handleSignInRedirect(
  onClose: () => void,
  router: { replace: (path: string) => void }
): Promise<void> {
  // Wait for session to be established
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    // AuthContext already has an onAuthStateChange listener that will update the state
    // We just need to wait a bit for React to re-render with the updated state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onClose();
    const redirectPath = getRedirectPath();
    router.replace(redirectPath);
    return;
  }

  // Wait for auth state change if session not immediately available
  let subscriptionCleaned = false;
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session && !subscriptionCleaned) {
      subscriptionCleaned = true;
      subscription.unsubscribe();
      
      // Small delay to ensure React state updates
      setTimeout(() => {
        onClose();
        const redirectPath = getRedirectPath();
        router.replace(redirectPath);
      }, 200);
    }
  });

  // Timeout fallback - check session after delay
  setTimeout(async () => {
    if (!subscriptionCleaned) {
      subscriptionCleaned = true;
      subscription.unsubscribe();
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        onClose();
        const redirectPath = getRedirectPath();
        router.replace(redirectPath);
      }
    }
  }, 2000);
}


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
    // Small delay to ensure auth state is updated in context
    await new Promise(resolve => setTimeout(resolve, 300));
    
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
      onClose();
      const redirectPath = getRedirectPath();
      router.replace(redirectPath);
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


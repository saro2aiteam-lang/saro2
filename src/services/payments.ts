export type CheckoutResult = {
  checkoutUrl: string;
};

export class CheckoutError extends Error {
  constructor(message: string, public code: string, public cause?: unknown) {
    super(message);
    this.name = 'CheckoutError';
  }
}

export async function createCheckoutSession(planId: string): Promise<CheckoutResult> {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ planId }),
  });

  if (response.status === 401) {
    throw new CheckoutError('Authentication required', 'AUTH_REQUIRED');
  }

  if (response.status === 429) {
    const payload = await response.json().catch(() => ({}));
    const retryAfter = payload.retryAfter || 60;
    throw new CheckoutError(
      `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
      'RATE_LIMIT_EXCEEDED',
      payload
    );
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = (payload && (payload.error || payload.message)) || 'Failed to create checkout session';
    
    // 在控制台输出详细错误信息，方便调试
    console.error('[Checkout Error]', {
      status: response.status,
      planId,
      error: payload.error,
      message: payload.message,
      debug: payload.debug,
    });
    
    const error = new CheckoutError(message, 'CHECKOUT_FAILED', payload);
    
    // 提供用户友好的错误消息
    if (message.includes('API key') || message.includes('not configured')) {
      error.message = 'Payment service is temporarily unavailable. Please contact support@saro2.ai for assistance.';
    } else if (message.includes('安全错误') || message.includes('Security')) {
      error.message = 'Payment service configuration error. Please contact support@saro2.ai.';
    } else if (message.includes('Plan not found') || message.includes('Plan is not configured')) {
      error.message = 'This plan is not available. Please select a different plan or contact support.';
    } else if (message.includes('Too Many Requests') || message.includes('rate limit')) {
      error.message = 'Too many requests. Please wait a moment and try again.';
    } else if (response.status >= 500) {
      error.message = 'Payment service is temporarily unavailable. Please try again in a few moments.';
    }
    
    throw error;
  }

  const data = await response.json();
  const checkoutUrl = data?.checkoutUrl || data?.checkout_url;
  if (!checkoutUrl) {
    throw new CheckoutError('Checkout URL missing in response', 'INVALID_RESPONSE');
  }

  return { checkoutUrl };
}

export async function startCheckout(planId: string): Promise<CheckoutResult> {
  try {
    const result = await createCheckoutSession(planId);

    if (typeof window !== 'undefined') {
      window.location.assign(result.checkoutUrl);
    }

    return result;
  } catch (error) {
    throw error;
  }
}

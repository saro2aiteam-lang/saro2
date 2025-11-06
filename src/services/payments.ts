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
    
    // 如果是配置错误，提供更明确的提示
    if (message.includes('API key') || message.includes('not configured')) {
      error.message = 'Payment service not configured. Please contact support.';
    } else if (message.includes('安全错误') || message.includes('Security')) {
      error.message = 'Payment service configuration error. Please contact support.';
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

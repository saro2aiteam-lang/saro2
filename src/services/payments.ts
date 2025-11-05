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
    throw new CheckoutError(message, 'CHECKOUT_FAILED');
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

import { getSupabaseAdmin } from '@/lib/supabase-admin';

export interface CreditSnapshot {
  balance: number;
  total: number;
  spent: number;
}

const toNumber = (value: any): number => Number(value ?? 0);

export async function fetchCreditSnapshot(userId: string): Promise<CreditSnapshot | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .select('credits_balance, credits_total, credits_spent')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[credits] fetch snapshot error', error);
    return null;
  }

  return {
    balance: toNumber(data.credits_balance),
    total: toNumber(data.credits_total),
    spent: toNumber(data.credits_spent),
  };
}

export async function debitCredits(
  userId: string,
  amount: number,
  reason?: string,
  metadata?: Record<string, unknown>
): Promise<CreditSnapshot> {
  const { data, error } = await getSupabaseAdmin().rpc('debit_user_credits_transaction', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason ?? null,
    p_metadata: metadata ?? null,
  });

  if (error) {
    console.error('[credits] debit error', error);
    if (error.code === 'P0008') {
      throw new Error('INSUFFICIENT_BALANCE');
    }
    throw error;
  }

  const row = (data as any[])?.[0];
  if (!row) {
    throw new Error('Failed to debit credits');
  }

  return {
    balance: toNumber(row.credits_balance),
    total: toNumber(row.credits_total),
    spent: toNumber(row.credits_spent),
  };
}

export async function creditCredits(
  userId: string,
  amount: number,
  reason?: string,
  metadata?: Record<string, unknown>
): Promise<CreditSnapshot> {
  const { data, error } = await getSupabaseAdmin().rpc('credit_user_credits_transaction', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason ?? null,
    p_metadata: metadata ?? null,
  });

  if (error) {
    console.error('[credits] credit error', error);
    throw error;
  }

  const row = (data as any[])?.[0];
  if (!row) {
    throw new Error('Failed to credit credits');
  }

  return {
    balance: toNumber(row.credits_balance),
    total: toNumber(row.credits_total),
    spent: toNumber(row.credits_spent),
  };
}

export async function refundCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<CreditSnapshot> {
  console.log(`[CREDITS] Refunding ${amount} credits to user ${userId}, reason: ${reason}`);
  
  const { data, error } = await getSupabaseAdmin().rpc('refund_user_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_metadata: metadata ?? null,
  });

  if (error) {
    console.error('[credits] refund error', error);
    throw error;
  }

  const row = (data as any[])?.[0];
  if (!row) {
    throw new Error('Failed to refund credits');
  }

  console.log(`[CREDITS] Successfully refunded ${amount} credits to user ${userId}`);

  return {
    balance: toNumber(row.credits_balance),
    total: toNumber(row.credits_total),
    spent: toNumber(row.credits_spent),
  };
}

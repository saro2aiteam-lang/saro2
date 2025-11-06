"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
  id: number;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  creemPaymentId: string | null;
  subscription: {
    id: number;
    planType: string;
    planStatus: string;
  } | null;
  createdAt: string;
}

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/history?limit=50');
      
      if (!response.ok) {
        throw new Error('Failed to load payment history');
      }

      const data = await response.json();
      setPayments(data.payments || []);
      setHasMore(data.hasMore || false);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    // Amount is in cents, convert to dollars
    const dollars = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase() || 'USD',
    }).format(dollars);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      succeeded: { label: 'Succeeded', variant: 'default' },
      failed: { label: 'Failed', variant: 'destructive' },
      pending: { label: 'Pending', variant: 'secondary' },
      refunded: { label: 'Refunded', variant: 'outline' },
      partially_refunded: { label: 'Partially Refunded', variant: 'outline' },
    };

    const statusInfo = statusMap[status.toLowerCase()] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatPlanName = (planType: string | null) => {
    if (!planType) return 'One-time Purchase';
    return planType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your payment history will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No payments found
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>View all your payment records</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">
                    {formatAmount(payment.amount, payment.currency)}
                  </span>
                  {getStatusBadge(payment.status)}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(payment.createdAt), 'MMM d, yyyy HH:mm')}
                </span>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Type: {payment.subscription ? 'Subscription' : 'One-time Purchase'}
                </p>
                {payment.subscription && (
                  <p>Plan: {formatPlanName(payment.subscription.planType)}</p>
                )}
                <p>Method: {payment.paymentMethod || 'Unknown'}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


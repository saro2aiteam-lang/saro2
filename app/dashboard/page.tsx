import Account from '@/page-components/Account'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Dashboard - Manage Your sora2 AI Account | sora2 AI',
  description: 'Manage your sora2 AI account settings, view usage, manage subscriptions and credits. Profile settings and account security management.',
  robots: {
    index: false,  // Dashboard page should not be indexed by search engines
    follow: false,
  },
}

export default function DashboardPage() {
  return <Account />
}


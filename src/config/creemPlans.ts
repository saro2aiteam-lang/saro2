export type CreemPlanCategory = 'subscription' | 'pack';
export type BillingInterval = 'month' | 'year';

export interface CreemPlanDefinition {
  id: string;
  category: CreemPlanCategory;
  name: string;
  priceCents: number;
  currency: 'USD';
  billingInterval?: BillingInterval;
  groupId?: string;
  credits: number;
  badge?: string;
  popular?: boolean;
  cta?: string;
  description?: string;
  checkoutUrl?: string;
  productId?: string;
  features?: string[];
  iconKey?: 'zap' | 'crown' | 'building';
}

const toUsdCents = (value: number) => Math.round(value * 100);

const readEnv = (key: string) => process.env[key];
const formatNumber = (value: number) => value.toLocaleString('en-US');

const resolvePlanConfig = (
  baseId: string,
  billing: 'MONTHLY' | 'YEARLY'
) => {
  const envKeyRoot = `NEXT_PUBLIC_CREEM_PLAN_${baseId}_${billing}`;

  const checkoutUrl = readEnv(`${envKeyRoot}_URL`);
  const productId = readEnv(`${envKeyRoot}_ID`);

  return { checkoutUrl, productId };
};

const buildSubscriptionPlans = () => {
  const tiers = [
    {
      baseId: 'basic',
      name: 'Basic',
      monthlyPrice: 19,
      yearlyPrice: 114,  // $19 × 12 × 0.5 = $114
      monthlyCredits: 600,  // 20个视频 × 30积分
      yearlyCredits: 7200,  // 240个视频 × 30积分
      monthlyBadge: 'Perfect for Beginners',
      yearlyBadge: 'Save 50%',
      monthlyCta: 'Start Creating',
      yearlyCta: 'Get Annual Deal',
      description: 'Perfect for testing and personal projects',
      baseFeatures: [
        '20 AI videos per month',
        'HD & 4K quality options',
        'Commercial usage rights',
        'Email support',
        'Generation history'
      ],
      iconKey: 'zap' as const,
      popular: false,
    },
    {
      baseId: 'creator',
      name: 'Creator',
      monthlyPrice: 49,
      yearlyPrice: 294,  // $49 × 12 × 0.5 = $294
      monthlyCredits: 1500,  // 50个视频 × 30积分
      yearlyCredits: 18000,  // 600个视频 × 30积分
      monthlyBadge: 'Most Popular',
      yearlyBadge: 'Save 50%',
      monthlyCta: 'Get Creator',
      yearlyCta: 'Best Value',
      description: 'For content creators and small teams',
      baseFeatures: [
        '50 AI videos per month',
        'HD & 4K quality options',
        'Commercial usage rights',
        'Priority email support',
        'API access (coming soon)',
        'Generation history'
      ],
      iconKey: 'crown' as const,
      popular: true,
    },
    {
      baseId: 'pro',
      name: 'Pro',
      monthlyPrice: 149,
      yearlyPrice: 894,  // $149 × 12 × 0.5 = $894
      monthlyCredits: 4500,  // 150个视频 × 30积分
      yearlyCredits: 54000,  // 1800个视频 × 30积分
      monthlyBadge: 'For Professionals',
      yearlyBadge: 'Save 50%',
      monthlyCta: 'Go Pro',
      yearlyCta: 'Unlock Pro',
      description: 'For agencies, studios & power users',
      baseFeatures: [
        '150 AI videos per month',
        'HD & 4K quality options',
        'Commercial usage rights',
        'Fastest processing',
        '1-on-1 professional consultation support',
        'Generation history'
      ],
      iconKey: 'building' as const,
      popular: false,
    }
  ];

  const yearlyBadgeFallback = 'Annual Savings';

  return tiers.flatMap((tier) => {
    const baseName = tier.name;
    const envPrefix = tier.baseId.toUpperCase();

    const monthlyPlanConfig = resolvePlanConfig(envPrefix, 'MONTHLY');
    const yearlyPlanConfig = resolvePlanConfig(envPrefix, 'YEARLY');

    return [
      {
        id: `${tier.baseId}_monthly`,
        category: 'subscription' as const,
        name: `${baseName} · Monthly`,
        priceCents: toUsdCents(tier.monthlyPrice),
        currency: 'USD' as const,
        billingInterval: 'month' as BillingInterval,
        groupId: tier.baseId,
        credits: tier.monthlyCredits,
        badge: tier.monthlyBadge,
        popular: tier.popular,
        cta: tier.monthlyCta ?? 'Start Creating',
        checkoutUrl: monthlyPlanConfig.checkoutUrl,
        productId: monthlyPlanConfig.productId,
        features: [
          `${formatNumber(tier.monthlyCredits)} credits included`,
          ...tier.baseFeatures,
        ],
        iconKey: tier.iconKey,
      },
      {
        id: `${tier.baseId}_yearly`,
        category: 'subscription' as const,
        name: `${baseName} · Annual`,
        priceCents: toUsdCents(tier.yearlyPrice),
        currency: 'USD' as const,
        billingInterval: 'year' as BillingInterval,
        groupId: tier.baseId,
        credits: tier.yearlyCredits,
        badge: tier.yearlyBadge ?? yearlyBadgeFallback,
        popular: tier.popular,
        cta: tier.yearlyCta ?? 'Save with Annual',
        checkoutUrl: yearlyPlanConfig.checkoutUrl,
        productId: yearlyPlanConfig.productId,
        features: [
          `${formatNumber(tier.yearlyCredits)} credits included`,
          `${Math.round(tier.yearlyCredits / 30)} AI videos per year`,
          'HD & 4K quality options',
          ...tier.baseFeatures.slice(2), // 跳过前两个（视频数量和HD选项），保留其他功能
        ],
        iconKey: tier.iconKey,
      }
    ];
  });
};

export const creemSubscriptionPlans: CreemPlanDefinition[] = buildSubscriptionPlans();

export const creemCreditPacks: CreemPlanDefinition[] = [
  {
    id: 'starter',
    category: 'pack',
    name: 'Starter Pack',
    priceCents: toUsdCents(9.9),
    currency: 'USD',
    credits: 300,  // 10个视频 × 30积分
    description: 'Pay once, use anytime — credits never expire',
    checkoutUrl: process.env.NEXT_PUBLIC_CREEM_PACK_STARTER_URL,
    productId: process.env.NEXT_PUBLIC_CREEM_PACK_STARTER_ID,
    iconKey: 'zap' as const,
  },
  {
    id: 'creator_pack',
    category: 'pack',
    name: 'Creator Pack',
    priceCents: toUsdCents(49),
    currency: 'USD',
    credits: 1500,  // 50个视频 × 30积分
    description: 'Pay once, use anytime — credits never expire',
    checkoutUrl: process.env.NEXT_PUBLIC_CREEM_PACK_CREATOR_URL,
    productId: process.env.NEXT_PUBLIC_CREEM_PACK_CREATOR_ID,
    iconKey: 'crown' as const,
  },
  {
    id: 'dev_team',
    category: 'pack',
    name: 'Professional Pack',
    priceCents: toUsdCents(199),
    currency: 'USD',
    credits: 6000,  // 200个视频 × 30积分
    description: 'Pay once, use anytime — credits never expire',
    checkoutUrl: process.env.NEXT_PUBLIC_CREEM_PACK_DEV_URL,
    productId: process.env.NEXT_PUBLIC_CREEM_PACK_DEV_ID,
    iconKey: 'building' as const,
  }
];

export const creemPlansById = Object.fromEntries(
  [...creemSubscriptionPlans, ...creemCreditPacks].map((plan) => [plan.id, plan])
);

export type CreemPlanId = keyof typeof creemPlansById;

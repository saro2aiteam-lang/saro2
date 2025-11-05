import { Zap, Crown, Building } from "lucide-react";
import { creemSubscriptionPlans, creemCreditPacks, type CreemPlanDefinition } from "./creemPlans";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const creditValueFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatPriceLabel = (plan: CreemPlanDefinition) => {
  if (plan.currency !== "USD") {
    return (plan.priceCents / 100).toString();
  }
  return currencyFormatter.format(plan.priceCents / 100);
};

const formatCreditValue = (plan: CreemPlanDefinition) => {
  if (!plan.credits || plan.credits <= 0) {
    return "—";
  }
  const value = plan.priceCents / 100 / plan.credits;
  return `${creditValueFormatter.format(value)}/credit`;
};

const periodLabel = (plan: CreemPlanDefinition) => {
  if (!plan.billingInterval) {
    return "";
  }
  return ` / ${plan.billingInterval}`;
};

const iconMap = {
  zap: Zap,
  crown: Crown,
  building: Building,
} as const;

// Shared pricing configuration to ensure consistency across the app
export const subscriptionPlans = creemSubscriptionPlans.map((plan) => {
  const Icon = plan.iconKey ? iconMap[plan.iconKey] : Zap;

  return {
    id: plan.id,
    name: plan.name,
    price: formatPriceLabel(plan),
    period: periodLabel(plan),
    billingInterval: plan.billingInterval,
    groupId: plan.groupId,
    priceCents: plan.priceCents,
    credits: `${plan.credits} Credits`,
    creditValue: formatCreditValue(plan),
    pricePerCredit: plan.credits > 0 ? plan.priceCents / 100 / plan.credits : undefined,
    badge: plan.badge,
    icon: Icon,
    features: plan.features ?? [],
    cta: plan.cta ?? "Start Creating",
    popular: plan.popular ?? false,
    checkoutUrl: plan.checkoutUrl,
    productId: plan.productId,
  };
});

export const oneTimePacks = creemCreditPacks.map((plan) => ({
  id: plan.id,
  name: plan.name,
  price: formatPriceLabel(plan),
  credits: `${plan.credits} Credits`,
  creditValue: formatCreditValue(plan),
  limitations: "No API access, No priority queue",
  checkoutUrl: plan.checkoutUrl,
  productId: plan.productId,
  iconKey: plan.iconKey,
}));

// For homepage teaser, we'll show simplified versions of the main subscription plans
export const homepagePricingTeaser = subscriptionPlans.filter((plan) => plan.period === '/month');

export const getSubscriptionPlanById = (id: string) =>
  subscriptionPlans.find((plan) => plan.id === id);

export const getCreemPlanById = (id: string) => {
  return [...creemSubscriptionPlans, ...creemCreditPacks].find((plan) => plan.id === id) ?? null;
};

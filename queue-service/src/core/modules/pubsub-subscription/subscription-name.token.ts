export function getSubscriptionNameToken(subscription: string): string {
  return `SUBSCRIPTION-${subscription.toUpperCase()}`;
}

import { getSubscriptionNameToken } from 'src/core/modules/pubsub-subscription/subscription-name.token';

export const SubscriptionName = 'queue-service-sub';
export const SubscriptionToken = getSubscriptionNameToken(SubscriptionName);

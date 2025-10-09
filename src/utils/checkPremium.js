export function checkPremiumValid(subscription) {
  if (!subscription) return false;
  const now = new Date();
  return subscription.startDate <= now && subscription.endDate >= now && subscription.active;
}

export const generateReferralCode = (telegramId) => {
  return `REF${telegramId}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
};

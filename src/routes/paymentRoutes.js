const express = require('express');
const router = express.Router();
const prisma = require('../db/prismaClient');
const { getMonthStart, getMonthEnd } = require('../utils/dateUtils');

/**
 * Simulated checkout endpoint:
 * POST /api/payments/create-checkout
 * body: { tgId, amount, provider }
 * For demo we will create a Payment (status: paid) instantly.
 */
router.post('/create-checkout', async (req, res) => {
  const { tgId, amount = 2.0, provider = 'demo' } = req.body;
  if (!tgId) return res.status(400).json({ error: 'tgId required' });

  // Find user
  let user = await prisma.user.findUnique({ where: { tgId: BigInt(tgId) }});
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      provider,
      amount: Number(amount),
      currency: 'USD',
      status: 'paid'
    }
  });

  // Determine premiumUntil = end of this calendar month
  const monthStart = getMonthStart(new Date());
  const monthEnd = getMonthEnd(new Date());

  // Update user premium status
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPremium: true,
      premiumMonth: monthStart,
      premiumUntil: monthEnd
    }
  });

  // If there's a referral record for this user where counted=false, mark counted and increment logic
  const pendingReferral = await prisma.referral.findFirst({
    where: { referredId: user.id, counted: false }
  });
  if (pendingReferral) {
    await prisma.referral.update({
      where: { id: pendingReferral.id },
      data: { counted: true }
    });
    // We don't update a separate counter table here; leaderboard will count on the fly.
  }

  res.json({ ok: true, payment });
});

/**
 * POST /api/payments/webhook
 * Simulated provider webhook (not used in demo)
 */
router.post('/webhook', async (req, res) => {
  // process provider webhook
  res.status(200).send('ok');
});

module.exports = router;

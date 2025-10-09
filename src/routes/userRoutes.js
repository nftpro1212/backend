const express = require('express');
const router = express.Router();
const prisma = require('../db/prismaClient');

/**
 * GET /api/users/me?tgi=<tgId>
 * For demo, we accept tgId query to return user profile
 */
router.get('/me', async (req, res) => {
  const tgId = req.query.tgId;
  if (!tgId) return res.status(400).json({ error: 'tgId query required' });
  const user = await prisma.user.findUnique({ where: { tgId: BigInt(tgId) }});
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

module.exports = router;

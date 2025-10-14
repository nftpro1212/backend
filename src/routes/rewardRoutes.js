import express from "express";
import Reward from "../models/Reward.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * 🎯 Sovgani saqlash
 */
router.post("/save", async (req, res) => {
  try {
    const { telegramId, prize } = req.body;
    if (!telegramId || !prize)
      return res.status(400).json({ message: "Malumot to‘liq emas" });

    // User mavjudligini tekshiramiz
    let user = await User.findOne({ telegramId });
    if (!user) {
      user = await User.create({
        telegramId,
        username: "unknown",
        referralCode: `ref_${telegramId}`,
      });
    }

    // Sovgani saqlaymiz
    const reward = await Reward.create({
      telegramId,
      prize,
    });

    res.json({ success: true, reward });
  } catch (err) {
    console.error("Reward saqlashda xato:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 📊 Foydalanuvchining barcha yutuqlarini olish
 */
router.get("/user/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;
    const rewards = await Reward.find({ telegramId }).sort({ createdAt: -1 });
    res.json({ success: true, rewards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 🏆 Eng ko‘p yutgan foydalanuvchilar (leaderboard)
 */
router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Reward.aggregate([
      { $group: { _id: "$telegramId", totalWins: { $sum: 1 } } },
      { $sort: { totalWins: -1 } },
      { $limit: 10 },
    ]);

    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

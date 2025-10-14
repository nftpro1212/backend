import express from "express";
import Reward from "../models/Reward.js";
import User from "../models/User.js";

const router = express.Router();

// 🎯 Sovgani saqlash (kunlik cheklov bilan)
router.post("/save", async (req, res) => {
  try {
    const { telegramId, prize } = req.body;
    if (!telegramId || !prize) {
      return res.status(400).json({ error: "Maʼlumot to‘liq emas" });
    }

    const user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const spinsToday = await Reward.countDocuments({
      telegramId,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const maxSpins = user.premium?.isActive ? 3 : 1;
    if (spinsToday >= maxSpins) {
      return res.status(403).json({
        error: `Cheklov: siz bugun ${maxSpins} marta aylantira olasiz.`,
      });
    }

    const reward = await Reward.create({ telegramId, prize });
    res.json({ success: true, reward });
  } catch (error) {
    console.error("Save reward error:", error);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// 📜 Tarixni olish (keyingi spin va premium holat bilan)
router.get("/history/:telegramId", async (req, res) => {
  try {
    const telegramId = req.params.telegramId;
    const user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

    const isPremium = user.premium?.isActive || false;
    const maxSpins = isPremium ? 3 : 1;

    // Bugungi spinlar soni
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const rewards = await Reward.find({ telegramId }).sort({ createdAt: -1 });
    const spinsToday = await Reward.countDocuments({
      telegramId,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const remainingSpins = Math.max(maxSpins - spinsToday, 0);

    // 🕐 Keyingi spin vaqti (agar limitga yetgan bo‘lsa)
    let nextSpin = null;
    if (remainingSpins === 0) {
      nextSpin = tomorrow; // ertangi kun 00:00
    }

    res.json({
      rewards,
      isPremium,
      remainingSpins,
      nextSpin,
    });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ error: "Server xatosi" });
  }
});

export default router;

import express from "express";
import Reward from "../models/Reward.js";
import User from "../models/User.js";

const router = express.Router();

// 🎯 Sovgani saqlash (kunlik cheklov bilan)
router.post("/save", async (req, res) => {
  try {
    const { telegramId, prize } = req.body;
    if (!telegramId || !prize) {
      return res.status(400).json({ error: "Malumot to‘liq emas" });
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

// 📜 Tarixni olish
router.get("/history/:telegramId", async (req, res) => {
  try {
    const rewards = await Reward.find({ telegramId: req.params.telegramId }).sort({
      createdAt: -1,
    });
    res.json({ rewards });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ error: "Server xatosi" });
  }
});

export default router;

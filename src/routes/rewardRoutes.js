import express from "express";
import Reward from "../models/Reward.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * 🎯 Sovgani saqlash (kunlik cheklov + premium tekshirish bilan)
 */
router.post("/save", async (req, res) => {
  try {
    const { telegramId, prize } = req.body;

    if (!telegramId || !prize) {
      return res.status(400).json({ error: "Ma'lumot to‘liq emas." });
    }

    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ error: "Foydalanuvchi topilmadi." });
    }

    // 🕒 Bugungi kun oralig‘ini aniqlaymiz
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // 🧮 Bugun nechta aylantirish bo‘lganini tekshiramiz
    const spinsToday = await Reward.countDocuments({
      telegramId,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    // 💎 Premium foydalanuvchilarga 3 ta, oddiylarga 1 ta imkoniyat
    const maxSpins = user.premium?.isActive ? 3 : 1;
    if (spinsToday >= maxSpins) {
      return res.status(403).json({
        error: `Siz bugun ${maxSpins} marta ruletni aylantira olasiz. Premium obuna oling va 3 ta imkoniyatga ega bo‘ling!`,
      });
    }

    // ✅ Yangi yutug‘ini saqlaymiz
    const reward = await Reward.create({ telegramId, prize });
    res.json({
      success: true,
      message: "Sovg‘a muvaffaqiyatli saqlandi!",
      reward,
      remainingSpins: maxSpins - (spinsToday + 1),
    });
  } catch (error) {
    console.error("💥 Reward saqlash xatosi:", error);
    res.status(500).json({ error: "Serverda xato yuz berdi." });
  }
});

/**
 * 📜 Foydalanuvchining sovg‘alar tarixini olish
 */
router.get("/history/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;

    if (!telegramId) {
      return res.status(400).json({ error: "Telegram ID kiritilmagan." });
    }

    const rewards = await Reward.find({ telegramId }).sort({ createdAt: -1 });
    res.json({ rewards });
  } catch (error) {
    console.error("💥 Tarixni olishda xato:", error);
    res.status(500).json({ error: "Serverda xato yuz berdi." });
  }
});

export default router;

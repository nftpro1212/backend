// routes/subscribeRoutes.js
import express from "express";
import User from "../models/User.js";

const router = express.Router();

// 🔹 1. Foydalanuvchini to‘lov sahifasiga yo‘naltirish
router.post("/", async (req, res) => {
  try {
    const { tgId } = req.body;
    if (!tgId) return res.status(400).json({ success: false, message: "tgId majburiy" });

    // 🔹 Sotuvchi URL, telegramId bilan
    const paymentUrl = `https://t.me/Ramzjan/pay?telegramId=${tgId}&amount=2`;

    return res.status(200).json({ success: true, paymentUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

// 🔹 2. To‘lov tasdiqlanganda webhook yoki admin tomonidan chaqiriladi
router.post("/confirm", async (req, res) => {
  try {
    const { tgId, expiresAt } = req.body;
    if (!tgId) return res.status(400).json({ success: false, message: "tgId majburiy" });

    const user = await User.findOne({ telegramId: tgId });
    if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

    user.premium = {
      isActive: true,
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // default 30 kun
    };

    await user.save();

    res.status(200).json({ success: true, message: "Premium aktivlandi", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

export default router;

// routes/subscribeRoutes.js
import express from "express";
import User from "../models/User.js";

const router = express.Router();

// 🔹 1. Foydalanuvchini adminga yo‘naltirish
router.post("/", async (req, res) => {
  try {
    const { tgId } = req.body;
    if (!tgId) return res.status(400).json({ success: false, message: "tgId majburiy" });

    // 🔹 Admin to'lov URL'i (Telegram orqali)
    const adminUsername = "Ramzjan";
    const paymentUrl = `https://t.me/${adminUsername}`;

    return res.status(200).json({ success: true, paymentUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

// 🔹 2. To‘lov tasdiqlanganda admin tomonidan qo‘lda chaqiriladi
router.post("/confirm", async (req, res) => {
  try {
    const { tgId } = req.body;
    if (!tgId) return res.status(400).json({ success: false, message: "tgId majburiy" });

    const user = await User.findOne({ telegramId: tgId });
    if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

    // 🔹 Bugungi sanani olish
    const today = new Date();

    // 🔹 Oyni oxirgi kunini hisoblash
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999); // kun oxirigacha

    user.premium = {
      isActive: true,
      expiresAt: lastDayOfMonth,
    };

    await user.save();

    res.status(200).json({ success: true, message: "Premium aktivlandi oy oxirigacha", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

export default router;

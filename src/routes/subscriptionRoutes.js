// routes/subscribeRoutes.js
import express from "express";
import User from "../models/User.js";

const router = express.Router();

/**
 * 🔹 1. Foydalanuvchini admin bilan to‘lov uchun bog‘lash
 * POST /api/subscribe
 */
router.post("/", async (req, res) => {
  try {
    const { tgId } = req.body;
    if (!tgId)
      return res.status(400).json({ success: false, message: "tgId majburiy" });

    // 🔸 Admin Telegram username (to‘lov uchun)
    const adminUsername = "Ramzjan";
    const paymentUrl = `https://t.me/${adminUsername}`;

    return res.status(200).json({
      success: true,
      message: "To‘lov uchun admin bilan bog‘laning",
      paymentUrl,
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

/**
 * 🔹 2. Admin tomonidan to‘lov tasdiqlanganda foydalanuvchiga premium berish
 * POST /api/subscribe/confirm
 */
router.post("/confirm", async (req, res) => {
  try {
    const { tgId } = req.body;
    if (!tgId)
      return res.status(400).json({ success: false, message: "tgId majburiy" });

    const user = await User.findOne({ telegramId: tgId });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Foydalanuvchi topilmadi" });

    // 🔹 Bugungi sana
    const today = new Date();

    // 🔹 Oyning oxirgi kuni
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    user.premium = {
      isActive: true,
      expiresAt: lastDayOfMonth,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: `Premium faollashtirildi (${lastDayOfMonth.toLocaleDateString()}) gacha`,
      premiumUntil: lastDayOfMonth,
      user,
    });
  } catch (error) {
    console.error("Confirm subscription error:", error);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

export default router;

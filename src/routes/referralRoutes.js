import express from "express";
import Referral from "../models/Referral.js";
import User from "../models/User.js";

const router = express.Router();

/* ============================================================
   🔹 1. Referal sonini olish (profil sahifasi uchun)
============================================================ */
router.get("/count", async (req, res) => {
  try {
    const { tgId } = req.query;
    if (!tgId) return res.status(400).json({ success: false, message: "tgId kiritilmagan" });

    // Foydalanuvchini tekshiramiz
    const user = await User.findOne({ telegramId: tgId });
    if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

    // Referral sonini sanaymiz
    const count = await Referral.countDocuments({ referrerTgId: tgId });
    res.json({ success: true, count });
  } catch (err) {
    console.error("Referral count xatosi:", err);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

/* ============================================================
   🔹 2. Eng ko‘p referal qilganlar (leaderboard)
============================================================ */
router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Referral.aggregate([
      { $group: { _id: "$referrerTgId", totalRefs: { $sum: 1 } } },
      { $sort: { totalRefs: -1 } },
      { $limit: 10 },
    ]);

    const detailed = await Promise.all(
      leaderboard.map(async (item) => {
        const user = await User.findOne({ telegramId: item._id });
        return {
          telegramId: item._id,
          username: user?.username || "no_username",
          first_name: user?.first_name || "Noma’lum",
          avatar: user?.avatar || "",
          totalRefs: item.totalRefs,
        };
      })
    );

    res.json({ success: true, leaderboard: detailed });
  } catch (err) {
    console.error("Leaderboard xatosi:", err);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

/* ============================================================
   🔹 3. Foydalanuvchining kimlarni chaqirganini ko‘rsatish
============================================================ */
router.get("/history/:tgId", async (req, res) => {
  try {
    const tgId = String(req.params.tgId); // ✅ Majburan stringga o‘tkazamiz

    const referrer = await User.findOne({ telegramId: tgId });
    if (!referrer) {
      return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });
    }

    const referrals = await Referral.find({ referrerTgId: tgId });
    if (!referrals.length) {
      return res.json({ success: true, invited: [], message: "Hech kimni chaqirmagan" });
    }

    const invited = await Promise.all(
      referrals.map(async (r) => {
        const u = await User.findOne({ telegramId: r.referredTgId });
        return {
          username: u?.username || "",
          first_name: u?.first_name || "Noma'lum foydalanuvchi",
          avatar: u?.avatar || "",
          joinedAt: r.createdAt,
        };
      })
    );

    res.json({ success: true, invited });
  } catch (err) {
    console.error("❌ History xatosi:", err);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});
 
export default router;

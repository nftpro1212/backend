import express from "express";
import Referral from "../models/Referral.js";
import User from "../models/User.js";

const router = express.Router();

/* ============================================================
   🔹 1. Referral qo‘shish (takrorlanishni oldini oladi)
============================================================ */
router.post("/add", async (req, res) => {
  try {
    const { referrerTgId, referredTgId } = req.body;

    if (!referrerTgId || !referredTgId)
      return res.status(400).json({ success: false, message: "Telegram IDlar kerak" });

    if (referrerTgId === referredTgId)
      return res.status(400).json({ success: false, message: "O'zingizni chaqira olmaysiz" });

    // Takrorlanmasin
    const existing = await Referral.findOne({ referrerTgId, referredTgId });
    if (existing)
      return res.status(400).json({ success: false, message: "Bu foydalanuvchi allaqachon chaqirilgan" });

    // Foydalanuvchilarni topamiz
    const referrer = await User.findOne({ telegramId: referrerTgId });
    const referred = await User.findOne({ telegramId: referredTgId });

    if (!referrer || !referred)
      return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

    const referral = await Referral.create({
      referrerId: referrer._id,
      referredId: referred._id,
      referrerTgId,
      referredTgId,
    });

    res.status(201).json({ success: true, referral });
  } catch (err) {
    console.error("Referral qo‘shishda xato:", err);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

/* ============================================================
   🔹 2. Referral sonini olish (profil sahifasi uchun)
============================================================ */
router.get("/count", async (req, res) => {
  try {
    const { tgId } = req.query;
    if (!tgId) return res.status(400).json({ success: false, message: "tgId kiritilmagan" });

    const user = await User.findOne({ telegramId: tgId });
    if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

    const count = await Referral.countDocuments({ referrerTgId: tgId });
    res.json({ success: true, count });
  } catch (err) {
    console.error("Referral count xatosi:", err);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

/* ============================================================
   🔹 3. Yetakchilar ro‘yxati (leaderboard)
============================================================ */
router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Referral.aggregate([
      { $group: { _id: "$referrerTgId", totalRefs: { $sum: 1 } } },
      { $sort: { totalRefs: -1 } },
      { $limit: 10 },
    ]);

    const detailed = await Promise.all(
      leaderboard.map(async (entry) => {
        const user = await User.findOne({ telegramId: entry._id });
        return {
          telegramId: entry._id,
          first_name: user?.first_name || "Foydalanuvchi",
          last_name: user?.last_name || "",
          username: user?.username || user?.first_name || "Foydalanuvchi",
          avatar: user?.avatar || "",
          totalRefs: entry.totalRefs,
        };
      })
    );

    res.json({ success: true, leaderboard: detailed });
  } catch (err) {
    console.error("Leaderboard olishda xato:", err);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

/* ============================================================
   🔹 4. Foydalanuvchining kimlarni chaqirganini ko‘rsatish
============================================================ */
router.get("/history/:tgId", async (req, res) => {
  try {
    const tgId = String(req.params.tgId);

    const referrer = await User.findOne({ telegramId: tgId });
    if (!referrer)
      return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

    const referrals = await Referral.find({ referrerTgId: tgId });

    if (!referrals.length)
      return res.json({ success: true, invited: [], message: "Hech kimni chaqirmagan" });

    const invited = await Promise.all(
      referrals.map(async (r) => {
        const u = await User.findOne({ telegramId: r.referredTgId });
        return {
          username: u?.username || u?.first_name || "Ismsiz foydalanuvchi",
          first_name: u?.first_name || "Ismsiz",
          avatar: u?.avatar || "",
          joinedAt: r.createdAt,
        };
      })
    );

    res.json({ success: true, invited });
  } catch (err) {
    console.error("Referral tarixini olishda xato:", err);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

export default router;

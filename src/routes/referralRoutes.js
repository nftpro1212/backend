// 📁 src/routes/referralRoutes.js
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
    if (!tgId) return res.status(400).json({ message: "tgId kiritilmagan" });

    // Endi biz referrerId o‘rniga referrerTgId dan foydalanamiz
    const count = await Referral.countDocuments({ referrerTgId: tgId });
    res.json({ count });
  } catch (err) {
    console.error("Referral count xatosi:", err);
    res.status(500).json({ message: "Server xatosi", error: err.message });
  }
});

/* ============================================================
   🔹 2. Leaderboard (eng ko‘p referal qilganlar)
============================================================ */
router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Referral.aggregate([
      { $group: { _id: "$referrerTgId", totalRefs: { $sum: 1 } } },
      { $sort: { totalRefs: -1 } },
      { $limit: 10 },
    ]);

    // foydalanuvchilar ma’lumotlarini olish
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

    res.json({ leaderboard: detailed });
  } catch (err) {
    console.error("Leaderboard xatosi:", err);
    res.status(500).json({ message: "Server xatosi", error: err.message });
  }
});

/* ============================================================
   🔹 3. Foydalanuvchining kimlarni chaqirganini ko‘rsatish
============================================================ */
router.get("/history/:5985347819", async (req, res) => {
  try {
    const { tgId } = req.params;

    // referrer mavjudligini tekshiramiz
    const referrer = await User.findOne({ telegramId: tgId });
    if (!referrer)
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });

    // referral tarixini olamiz
    const referrals = await Referral.find({ referrerTgId: tgId });

    if (!referrals.length)
      return res.json({ invited: [], message: "Hech kimni chaqirmagan" });

    // har bir referred foydalanuvchini topamiz
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

    res.json({ invited });
  } catch (err) {
    console.error("Referral ro‘yxati xatosi:", err);
    res.status(500).json({ message: "Server xatosi", error: err.message });
  }
});

/* ============================================================
   🔹 4. Referral tarixi (debug yoki admin uchun)
============================================================ */
router.get("/history/:5985347819", async (req, res) => {
  try {
    const { tgId } = req.params;
    const history = await Referral.find({ referrerTgId: tgId });

    if (!history.length)
      return res.status(404).json({ message: "Hech qanday referral topilmadi" });

    res.json({ count: history.length, data: history });
  } catch (err) {
    console.error("Referral history xatosi:", err);
    res.status(500).json({ message: "Server xatosi", error: err.message });
  }
});

export default router;

import express from "express";
import Referral from "../models/Referral.js";
import User from "../models/User.js";

const router = express.Router();

// 🔹 1. Referal sonini olish (profil uchun)
router.get("/count", async (req, res) => {
  try {
    const { tgId } = req.query;
    if (!tgId) return res.status(400).json({ message: "tgId kiritilmagan" });

    const user = await User.findOne({ telegramId: tgId });
    if (!user) return res.status(404).json({ message: "Foydalanuvchi topilmadi" });

    const count = await Referral.countDocuments({ referrerId: user._id });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Server xatosi", error: err.message });
  }
});

// 🔹 2. Leaderboard (eng ko‘p referal qilganlar)
router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Referral.aggregate([
      { $group: { _id: "$referrerId", totalRefs: { $sum: 1 } } },
      { $sort: { totalRefs: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 0,
          referrerId: "$userInfo.telegramId",
          username: "$userInfo.username",
          first_name: "$userInfo.first_name",
          totalRefs: 1,
        },
      },
    ]);

    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ message: "Server xatosi", error: err.message });
  }
});

// 🔹 3. Foydalanuvchining kimlarni chaqirganini ko‘rsatish
router.get("/invited/:tgId", async (req, res) => {
  try {
    const { tgId } = req.params;

    const referrer = await User.findOne({ telegramId: tgId });
    if (!referrer)
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });

    const referrals = await Referral.find({ referrerId: referrer._id }).populate("referredId");

    if (!referrals.length)
      return res.json({ invited: [], message: "Hech kimni chaqirmagan" });

    const invited = referrals.map((r) => ({
      username: r.referredId?.username || "",
      first_name: r.referredId?.first_name || "Noma'lum foydalanuvchi",
      joinedAt: r.createdAt,
    }));

    res.json({ invited });
  } catch (err) {
    console.error("Referral ro‘yxati xatosi:", err);
    res.status(500).json({ message: "Server xatosi", error: err.message });
  }
});

export default router;

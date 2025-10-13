import express from "express";
import Referral from "../models/Referral.js";
import User from "../models/User.js";

const router = express.Router();

// ✅ 1. Referral hisoblash
router.get("/count", async (req, res) => {
  try {
    const telegramId = req.query.telegramId;
    if (!telegramId)
      return res.status(400).json({ success: false, message: "telegramId majburiy" });

    const user = await User.findOne({ tgId: telegramId });
    if (!user)
      return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

    const count = await Referral.countDocuments({ referrerId: user._id });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("❌ Referral count xatosi:", error);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

// ✅ 2. Leaderboard (eng ko‘p taklif qilganlar)
router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Referral.aggregate([
      { $group: { _id: "$referrerId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          username: "$user.username",
          tgId: "$user.tgId",
          count: 1,
        },
      },
    ]);
    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error("❌ Leaderboard xatosi:", error);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

// ✅ 3. Referral yozish (Telegram orqali kirganda)
router.post("/register", async (req, res) => {
  try {
    const { refCode, newUserId } = req.body;

    if (!refCode || !newUserId)
      return res.status(400).json({ success: false, message: "Ma'lumot yetarli emas" });

    const referrer = await User.findOne({ referralCode: refCode });
    const referred = await User.findOne({ tgId: newUserId });

    if (!referrer || !referred)
      return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

    // O‘zi o‘zini taklif qilolmasin
    if (referrer._id.equals(referred._id))
      return res.status(400).json({ success: false, message: "O‘zingizni taklif qila olmaysiz" });

    // Takror yozmaslik
    const exists = await Referral.findOne({
      referrerId: referrer._id,
      referredId: referred._id,
    });
    if (exists)
      return res.status(200).json({ success: false, message: "Bu foydalanuvchi allaqachon taklif qilingan" });

    await Referral.create({
      referrerId: referrer._id,
      referredId: referred._id,
    });

    res.json({ success: true, message: "Referral muvaffaqiyatli yozildi" });
  } catch (error) {
    console.error("❌ Referral register xatosi:", error);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

export default router;

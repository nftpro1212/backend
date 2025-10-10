import express from "express";
import Referral from "../models/Referral.js";
import User from "../models/User.js";

const router = express.Router();

// 🔹 Foydalanuvchining referral soni
router.get("/count", async (req, res) => {
  try {
    const telegramId = req.query.telegramId;

    if (!telegramId) {
      return res.status(400).json({ success: false, message: "telegramId majburiy" });
    }

    const user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

    const count = await Referral.countDocuments({ referrerId: user._id });

    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("❌ Referral count xatosi:", error);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

// 🔹 Leaderboard — top referral foydalanuvchilari
router.get("/leaderboard", async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: "$referrerId",
          referrals: { $sum: 1 },
        },
      },
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
          _id: 0,
          telegramId: "$user.telegramId",
          username: "$user.username",
          first_name: "$user.first_name",
          avatar: "$user.avatar",
          referrals: 1,
        },
      },
      { $sort: { referrals: -1 } },
      { $limit: 10 },
    ];

    const leaderboard = await Referral.aggregate(pipeline);

    res.status(200).json({ success: true, leaderboard });
  } catch (error) {
    console.error("❌ Leaderboard xatosi:", error);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

export default router;

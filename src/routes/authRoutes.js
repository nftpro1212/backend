import express from "express";
import User from "../models/User.js";
import Referral from "../models/Referral.js";

const router = express.Router();

/* 🟢 LOGIN yoki REGISTER (Web Appdan kirganda) */
router.post("/login", async (req, res) => {
  try {
    const { telegramId, username, first_name, last_name, avatar, referralCode } = req.body;
    if (!telegramId) return res.status(400).json({ message: "telegramId majburiy" });

    let user = await User.findOne({ telegramId });

    if (!user) {
      // yangi user yaratish
      const newUser = new User({
        telegramId,
        username,
        first_name,
        last_name,
        avatar,
        referralCode: generateReferralCode(telegramId),
      });
      user = await newUser.save();

      // referral bo'lsa yozamiz
      if (referralCode) {
        const referrer = await User.findOne({ referralCode });
        if (referrer && referrer._id.toString() !== user._id.toString()) {
          const exists = await Referral.findOne({ referrerId: referrer._id, referredId: user._id });
          if (!exists) {
            await Referral.create({ referrerId: referrer._id, referredId: user._id });
            user.referredBy = referrer._id;
            await user.save();
          }
        }
      }
    }

    res.json({ user });
  } catch (err) {
    console.error("Login xatosi:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
});

/* 🟡 Referral sonini olish */
router.get("/referrals/count", async (req, res) => {
  try {
    const { telegramId } = req.query;
    const user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ message: "User topilmadi" });

    const count = await Referral.countDocuments({ referrerId: user._id });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

/* 🟣 Eng ko‘p taklif qilganlar ro‘yxati */
router.get("/referrals/leaderboard", async (req, res) => {
  try {
    const top = await Referral.aggregate([
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
          first_name: "$user.first_name",
          count: 1,
        },
      },
    ]);
    res.json(top);
  } catch (err) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

function generateReferralCode(telegramId) {
  return Buffer.from(String(telegramId)).toString("base64").slice(0, 8);
}

export default router;

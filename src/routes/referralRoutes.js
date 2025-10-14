import express from "express";
import Referral from "../models/Referral.js";
import User from "../models/User.js";

const router = express.Router();

/* ✅ 1. Referral sonini olish */
router.get("/count", async (req, res) => {
  try {
    const { tgId } = req.query;
    if (!tgId) {
      return res.status(400).json({
        success: false,
        message: "tgId majburiy parametr hisoblanadi",
      });
    }

    const user = await User.findOne({ tgId: Number(tgId) }) || await User.findOne({ tgId: String(tgId) });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Foydalanuvchi topilmadi" });

    const count = await Referral.countDocuments({ referrerId: user._id });

    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("❌ Referral count xatosi:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server xatosi yuz berdi" });
  }
});

/* ✅ 2. Eng ko‘p taklif qilgan foydalanuvchilar ro‘yxati */
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
          _id: 0,
          username: "$user.username",
          first_name: "$user.first_name",
          tgId: "$user.tgId",
          count: 1,
        },
      },
    ]);

    return res.status(200).json({ success: true, leaderboard });
  } catch (error) {
    console.error("❌ Leaderboard xatosi:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server xatosi yuz berdi" });
  }
});

/* ✅ 3. Referral yozish (taklif orqali kirganda) */
router.post("/register", async (req, res) => {
  try {
    const { refCode, tgId } = req.body;
    if (!refCode || !tgId) {
      return res.status(400).json({
        success: false,
        message: "refCode va tgId majburiy maydonlar",
      });
    }

    const referrer = await User.findOne({ referralCode: refCode });
    const referred = await User.findOne({ tgId: Number(tgId) }) || await User.findOne({ tgId: String(tgId) });

    if (!referrer || !referred) {
      return res
        .status(404)
        .json({ success: false, message: "Foydalanuvchi topilmadi" });
    }

    if (referrer._id.equals(referred._id)) {
      return res.status(400).json({
        success: false,
        message: "O‘zingizni taklif qila olmaysiz 😅",
      });
    }

    const existingReferral = await Referral.findOne({
      referrerId: referrer._id,
      referredId: referred._id,
    });

    if (existingReferral) {
      return res.status(200).json({
        success: true,
        message: "Bu foydalanuvchi allaqachon taklif qilingan",
      });
    }

    await Referral.create({
      referrerId: referrer._id,
      referredId: referred._id,
    });

    // (ixtiyoriy) referrer uchun bonus
    // referrer.balance = (referrer.balance || 0) + 10000;
    // await referrer.save();

    return res.status(201).json({
      success: true,
      message: "Referral muvaffaqiyatli yozildi 🎉",
    });
  } catch (error) {
    console.error("❌ Referral register xatosi:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server xatosi yuz berdi" });
  }
});

export default router;

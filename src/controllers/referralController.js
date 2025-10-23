import mongoose from "mongoose";
import Referral from "../models/Referral.js";
import User from "../models/User.js";

/**
 * 🔹 POST /api/referrals/create
 * Referrer foydalanuvchi tomonidan yangi user taklif qilinadi
 */
export const createReferral = async (req, res) => {
  try {
    const { referrerCode, referredTelegramId } = req.body;

    if (!referrerCode || !referredTelegramId) {
      return res.status(400).json({
        success: false,
        message: "referrerCode va referredTelegramId majburiy",
      });
    }

    const referrer = await User.findOne({ referralCode: referrerCode });
    const referred =
      (await User.findOne({ telegramId: Number(referredTelegramId) })) ||
      (await User.findOne({ telegramId: String(referredTelegramId) }));

    if (!referrer) {
      return res.status(404).json({ success: false, message: "Referrer topilmadi" });
    }
    if (!referred) {
      return res
        .status(404)
        .json({ success: false, message: "Referred foydalanuvchi topilmadi" });
    }

    if (referrer._id.equals(referred._id)) {
      return res.status(400).json({
        success: false,
        message: "O'zingizni o'zingiz taklif qila olmaysiz",
      });
    }

    // Duplikat tekshiruvi
    const exists = await Referral.findOne({
      referrerId: referrer._id,
      referredId: referred._id,
    });
    if (exists) {
      return res.status(200).json({
        success: false,
        message: "Bu referral allaqachon mavjud",
      });
    }

    const newReferral = await Referral.create({
      referrerId: referrer._id,
      referredId: referred._id,
    });

    return res.status(201).json({
      success: true,
      message: "Referral muvaffaqiyatli yaratildi",
      referral: newReferral,
    });
  } catch (err) {
    console.error("❌ createReferral error:", err);
    return res.status(500).json({
      success: false,
      message: "Referral yaratishda xatolik yuz berdi",
      error: err.message,
    });
  }
};

/**
 * 🔹 GET /api/referrals/count?telegramId=123
 * Foydalanuvchining nechta referral qilganini hisoblaydi
 */
export const getReferralCount = async (req, res) => {
  try {
    const { telegramId } = req.query;

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: "telegramId majburiy parametr",
      });
    }

    const user =
      (await User.findOne({ telegramId: Number(telegramId) })) ||
      (await User.findOne({ telegramId: String(telegramId) }));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }

    const count = await Referral.countDocuments({ referrerId: user._id });

    return res.status(200).json({ success: true, count });
  } catch (err) {
    console.error("❌ getReferralCount error:", err);
    return res.status(500).json({
      success: false,
      message: "Referral sonini olishda xatolik",
      error: err.message,
    });
  }
};

/**
 * 🔹 GET /api/referrals/user/:telegramId
 * Kim kimni taklif qilganini to‘liq qaytaradi
 */
export const getUserReferrals = async (req, res) => {
  try {
    const { telegramId } = req.params;

    const user =
      (await User.findOne({ telegramId: Number(telegramId) })) ||
      (await User.findOne({ telegramId: String(telegramId) }));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User topilmadi",
      });
    }

    const referrals = await Referral.find({ referrerId: user._id })
      .populate("referrerId", "first_name username telegramId")
      .populate("referredId", "first_name username telegramId")
      .sort({ createdAt: -1 });

    const formatted = referrals.map((r) => ({
      referrer: r.referrerId,
      referred: r.referredId,
      date: r.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      list: formatted,
    });
  } catch (err) {
    console.error("❌ getUserReferrals error:", err);
    return res.status(500).json({
      success: false,
      message: "Referral ro‘yxatini olishda xatolik",
      error: err.message,
    });
  }
};

/**
 * 🔹 GET /api/referrals/leaderboard
 * Eng ko‘p referral qilgan top 10 foydalanuvchilar
 */
export const getLeaderboard = async (req, res) => {
  try {
    const top = await Referral.aggregate([
      { $group: { _id: "$referrerId", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    // Foydalanuvchi ma'lumotlarini xavfsiz yuklash
    const results = await Promise.allSettled(
      top.map(async (item) => {
        if (!mongoose.Types.ObjectId.isValid(item._id)) return null;
        const user = await User.findById(item._id).select(
          "first_name username telegramId avatar"
        );
        if (!user) return null;
        return {
          first_name: user.first_name || "Noma’lum",
          username: user.username || "",
          telegramId: user.telegramId || "",
          avatar: user.avatar || "",
          total: item.total,
        };
      })
    );

    const leaderboard = results
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => r.value);

    return res.status(200).json({ success: true, leaderboard });
  } catch (err) {
    console.error("❌ getLeaderboard error:", err);
    return res.status(500).json({
      success: false,
      message: "Leaderboardni olishda xatolik yuz berdi",
      error: err.message,
    });
  }
};

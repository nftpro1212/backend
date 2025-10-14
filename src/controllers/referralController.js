import Referral from "../models/Referral.js";
import User from "../models/User.js";

/**
 * POST /api/referrals/create
 * body: { referrerCode: string, referredTelegramId: number|string }
 */
export const createReferral = async (req, res) => {
  try {
    const { referrerCode, referredTelegramId } = req.body;
    if (!referrerCode || !referredTelegramId) {
      return res.status(400).json({ success: false, message: "referrerCode va referredTelegramId majburiy" });
    }

    // topuvchi: referrer kod bo'yicha
    const referrer = await User.findOne({ referralCode: referrerCode });
    const referred = await User.findOne({ telegramId: Number(referredTelegramId) }) || await User.findOne({ telegramId: String(referredTelegramId) });

    if (!referrer) return res.status(404).json({ success: false, message: "Referrer topilmadi" });
    if (!referred) return res.status(404).json({ success: false, message: "Referred (yangi foydalanuvchi) topilmadi" });

    // o'zi o'zi taklif qilolmasin
    if (referrer._id.equals(referred._id)) {
      return res.status(400).json({ success: false, message: "O'zingizni taklif qila olmaysiz" });
    }

    // takror yozilmaslik
    const exists = await Referral.findOne({ referrerId: referrer._id, referredId: referred._id });
    if (exists) {
      return res.status(200).json({ success: false, message: "Bu referral allaqachon mavjud" });
    }

    const doc = await Referral.create({ referrerId: referrer._id, referredId: referred._id });

    // (ixtiyoriy) referrerga bonus — agar xohlasangiz modelda maydon bo'lsa:
    // referrer.points = (referrer.points || 0) + 10;
    // await referrer.save();

    return res.status(201).json({ success: true, message: "Referral yozildi", referral: doc });
  } catch (err) {
    console.error("❌ createReferral:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/referrals/count?telegramId=123
 */
export const getReferralCount = async (req, res) => {
  try {
    const telegramId = req.query.telegramId;
    if (!telegramId) return res.status(400).json({ success: false, message: "telegramId majburiy" });

    const user = await User.findOne({ telegramId: Number(telegramId) }) || await User.findOne({ telegramId: String(telegramId) });
    if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

    const count = await Referral.countDocuments({ referrerId: user._id });
    return res.status(200).json({ success: true, count });
  } catch (err) {
    console.error("❌ getReferralCount:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/referrals/user/:telegramId
 */
export const getUserReferrals = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await User.findOne({ telegramId: Number(telegramId) }) || await User.findOne({ telegramId: String(telegramId) });
    if (!user) return res.status(404).json({ success: false, message: "User topilmadi" });

    const referrals = await Referral.find({ referrerId: user._id }).populate("referredId", "username first_name telegramId avatar referralCode");
    return res.status(200).json({ success: true, count: referrals.length, list: referrals });
  } catch (err) {
    console.error("❌ getUserReferrals:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/referrals/leaderboard
 */
export const getLeaderboard = async (req, res) => {
  try {
    const top = await Referral.aggregate([
      { $group: { _id: "$referrerId", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
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
          telegramId: "$user.telegramId",
          total: 1,
        },
      },
    ]);
    return res.status(200).json({ success: true, leaderboard: top });
  } catch (err) {
    console.error("❌ getLeaderboard:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

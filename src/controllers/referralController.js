import Referral from "../models/Referral.js";
import User from "../models/User.js";

/**
 * POST /api/referrals/create
 * body: { referrerCode, referredTelegramId }
 */
export const createReferral = async (req, res) => {
  try {
    const { referrerCode, referredTelegramId } = req.body;

    if (!referrerCode || !referredTelegramId) {
      return res.status(400).json({ success: false, message: "referrerCode va referredTelegramId kerak" });
    }

    const referrer = await User.findOne({ referralCode: referrerCode });
    if (!referrer) return res.status(404).json({ success: false, message: "Referrer topilmadi" });

    const referred = await User.findOne({ telegramId: String(referredTelegramId) });
    if (!referred) return res.status(404).json({ success: false, message: "Referred foydalanuvchi topilmadi" });

    // o'zini taklif qilmasin
    if (referrer.telegramId === referred.telegramId) {
      return res.status(400).json({ success: false, message: "O'zingizni taklif qila olmaysiz" });
    }

    // takror yozilmasin
    const exists = await Referral.findOne({ referrerId: referrer._id, referredId: referred._id });
    if (exists) {
      return res.status(200).json({ success: false, message: "Bu referral allaqachon mavjud" });
    }

    const doc = await Referral.create({
      referrerId: referrer._id,
      referredId: referred._id,
    });

    res.status(201).json({ success: true, referral: doc });
  } catch (err) {
    console.error("❌ createReferral:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/referrals/count?telegramId=123
 */
export const getReferralCount = async (req, res) => {
  try {
    const { telegramId } = req.query;
    if (!telegramId) {
      return res.status(400).json({ success: false, message: "telegramId kerak" });
    }

    const user = await User.findOne({ telegramId: String(telegramId) });
    if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

    const count = await Referral.countDocuments({ referrerId: user._id });

    res.status(200).json({ success: true, count });
  } catch (err) {
    console.error("❌ getReferralCount:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/referrals/user/:telegramId
 */
export const getUserReferrals = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await User.findOne({ telegramId: String(telegramId) });
    if (!user) return res.status(404).json({ success: false, message: "User topilmadi" });

    const referrals = await Referral.find({ referrerId: user._id }).populate(
      "referredId",
      "username first_name telegramId avatar referralCode"
    );

    res.status(200).json({
      success: true,
      count: referrals.length,
      referrals,
    });
  } catch (err) {
    console.error("❌ getUserReferrals:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/referrals/leaderboard
 */
export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Referral.aggregate([
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
          username: "$user.username",
          first_name: "$user.first_name",
          telegramId: "$user.telegramId",
          total: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, leaderboard });
  } catch (err) {
    console.error("❌ getLeaderboard:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

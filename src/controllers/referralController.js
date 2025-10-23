import Referral from "../models/Referral.js";
import User from "../models/User.js";

/**
 * 🔹 POST /api/referrals/create
 */
export const createReferral = async (req, res) => {
  try {
    const { referrerCode, referredTelegramId } = req.body;
    if (!referrerCode || !referredTelegramId) {
      return res
        .status(400)
        .json({ success: false, message: "referrerCode va referredTelegramId majburiy" });
    }

    const referrer = await User.findOne({ referralCode: referrerCode });
    const referred =
      (await User.findOne({ telegramId: Number(referredTelegramId) })) ||
      (await User.findOne({ telegramId: String(referredTelegramId) }));

    if (!referrer)
      return res.status(404).json({ success: false, message: "Referrer topilmadi" });
    if (!referred)
      return res
        .status(404)
        .json({ success: false, message: "Referred (yangi foydalanuvchi) topilmadi" });

    if (referrer._id.equals(referred._id)) {
      return res
        .status(400)
        .json({ success: false, message: "O'zingizni taklif qila olmaysiz" });
    }

    const exists = await Referral.findOne({ referrerId: referrer._id, referredId: referred._id });
    if (exists) {
      return res
        .status(200)
        .json({ success: false, message: "Bu referral allaqachon mavjud" });
    }

    const doc = await Referral.create({ referrerId: referrer._id, referredId: referred._id });

    return res.status(201).json({ success: true, message: "Referral yozildi", referral: doc });
  } catch (err) {
    console.error("❌ createReferral:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 🔹 GET /api/referrals/count?telegramId=123
 */
export const getReferralCount = async (req, res) => {
  try {
    const telegramId = req.query.telegramId;
    if (!telegramId)
      return res.status(400).json({ success: false, message: "telegramId majburiy" });

    const user =
      (await User.findOne({ telegramId: Number(telegramId) })) ||
      (await User.findOne({ telegramId: String(telegramId) }));
    if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

    const count = await Referral.countDocuments({ referrerId: user._id });
    return res.status(200).json({ success: true, count });
  } catch (err) {
    console.error("❌ getReferralCount:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 🔹 GET /api/referrals/user/:telegramId
 * Kim kimni chaqirganini to‘liq chiqaradi
 */
export const getUserReferrals = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user =
      (await User.findOne({ telegramId: Number(telegramId) })) ||
      (await User.findOne({ telegramId: String(telegramId) }));
    if (!user) return res.status(404).json({ success: false, message: "User topilmadi" });

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
    console.error("❌ getUserReferrals:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 🔹 GET /api/referrals/leaderboard
 * Foydalanuvchi ismlari bilan birga top 10
 */
export const getLeaderboard = async (req, res) => {
  try {
    const top = await Referral.aggregate([
      { $group: { _id: "$referrerId", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    // Har bir foydalanuvchining ma’lumotini olish
    const leaderboard = await Promise.all(
      top.map(async (item) => {
        const user = await User.findById(item._id).select(
          "first_name username telegramId avatar"
        );
        return {
          first_name: user?.first_name || "Noma’lum",
          username: user?.username || "",
          telegramId: user?.telegramId || "",
          avatar: user?.avatar || "",
          total: item.total,
        };
      })
    );

    return res.status(200).json({ success: true, leaderboard });
  } catch (err) {
    console.error("❌ getLeaderboard:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

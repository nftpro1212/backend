import Referral from "../models/Referral.js";
import User from "../models/User.js"; // foydalanuvchi ma'lumotini olish uchun

// ✅ Referral qo‘shish
export const addReferral = async (req, res) => {
  try {
    const referrerTgId = String(req.body.referrerTgId);
    const referredTgId = String(req.body.referredTgId);

    if (!referrerTgId || !referredTgId)
      return res.status(400).json({ message: "Telegram IDlar kerak" });

    if (referrerTgId === referredTgId)
      return res.status(400).json({ message: "O'zingizni chaqira olmaysiz" });

    const referral = await Referral.findOneAndUpdate(
      { referrerTgId, referredTgId },
      { referrerTgId, referredTgId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, referral });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Bu foydalanuvchi allaqachon chaqirilgan" });
    }
    console.error("Referral qo'shishda xato:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
};

// ✅ Referral sonini olish (profil uchun)
export const getReferralCount = async (req, res) => {
  try {
    const { tgId } = req.query;
    if (!tgId) return res.status(400).json({ message: "tgId kerak" });

    const count = await Referral.countDocuments({ referrerTgId: tgId });
    res.json({ count });
  } catch (error) {
    console.error("Referral sanashda xato:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
};

// ✅ Yetakchilar ro‘yxati (leaderboard)
export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Referral.aggregate([
      { $group: { _id: "$referrerTgId", totalReferrals: { $sum: 1 } } },
      { $sort: { totalReferrals: -1 } },
      { $limit: 20 },
    ]);

    // Har bir foydalanuvchining username va name’sini qo‘shamiz
    const results = await Promise.all(
      leaderboard.map(async (entry) => {
        const user = await User.findOne({ telegramId: entry._id });

        return {
          telegramId: entry._id,
          first_name: user?.first_name || "Noma'lum",
          last_name: user?.last_name || "",
          username: user?.username || "",
          avatar: user?.avatar || "",
          totalReferrals: entry.totalReferrals,
        };
      })
    );

    res.json(results);
  } catch (error) {
    console.error("Leaderboard olishda xato:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
};

// ✅ Ma'lum foydalanuvchining chaqirgan odamlarini olish
export const getUserReferrals = async (req, res) => {
  try {
    const { tgId } = req.params;
    if (!tgId) return res.status(400).json({ message: "tgId kerak" });

    const referrals = await Referral.find({ referrerTgId: tgId });

    if (!referrals.length) {
      return res.status(200).json({
        success: true,
        message: "Hozircha hech kimni chaqirmagan 😕",
        referredUsers: [],
      });
    }

    // Har bir referred foydalanuvchi haqida ma'lumot olish
    const referredUsers = await Promise.all(
      referrals.map(async (ref) => {
        const user = await User.findOne({ telegramId: ref.referredTgId });
        return {
          telegramId: ref.referredTgId,
          first_name: user?.first_name || "Noma'lum",
          last_name: user?.last_name || "",
          username: user?.username || "",
          avatar: user?.avatar || "",
          joinedAt: ref.createdAt,
        };
      })
    );

    res.json({
      success: true,
      total: referredUsers.length,
      referredUsers,
    });
  } catch (error) {
    console.error("Foydalanuvchi referral tarixini olishda xato:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
};

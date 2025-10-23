import Referral from "../models/Referral.js";
import User from "../models/User.js"; // foydalanuvchi ma'lumotini olish uchun

// ✅ Yangi referral saqlash
export const addReferral = async (req, res) => {
  try {
    const { referrerTgId, referredTgId } = req.body;

    if (!referrerTgId || !referredTgId) {
      return res.status(400).json({ message: "Telegram IDlar kerak" });
    }

    if (referrerTgId === referredTgId) {
      return res.status(400).json({ message: "O'zingizni chaqira olmaysiz" });
    }

    // Takrorlanishni oldini olish
    const existing = await Referral.findOne({ referrerTgId, referredTgId });
    if (existing) {
      return res.status(400).json({ message: "Bu foydalanuvchi allaqachon chaqirilgan" });
    }

    const referral = await Referral.create({ referrerTgId, referredTgId });
    res.status(201).json(referral);
  } catch (error) {
    console.error("Referral qo'shishda xato:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
};

// ✅ Referral sonini olish (har bir foydalanuvchi uchun)
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
          name: user?.name || "Noma'lum foydalanuvchi",
          username: user?.username || "",
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

    // Har bir referred foydalanuvchi haqida ma'lumot olish
    const referredUsers = await Promise.all(
      referrals.map(async (ref) => {
        const user = await User.findOne({ telegramId: ref.referredTgId });
        return {
          telegramId: ref.referredTgId,
          name: user?.name || "Noma'lum foydalanuvchi",
          username: user?.username || "",
          date: ref.createdAt,
        };
      })
    );

    res.json(referredUsers);
  } catch (error) {
    console.error("Foydalanuvchi referral tarixini olishda xato:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
};

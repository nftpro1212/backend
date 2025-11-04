import Referral from "../models/Referral.js";
import User from "../models/User.js";

export const addReferral = async (req, res) => {
  try {
    const referrerTgId = String(req.body.referrerTgId);
    const referredTgId = String(req.body.referredTgId);

    if (!referrerTgId || !referredTgId)
      return res.status(400).json({ message: "Telegram IDlar kerak" });

    if (referrerTgId === referredTgId)
      return res.status(400).json({ message: "O'zingizni chaqira olmaysiz" });

    // Agar referred foydalanuvchi allaqachon mavjud bo‘lsa — referral qo‘shilmasin
    const existingUser = await User.findOne({ telegramId: referredTgId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Referral faqat yangi foydalanuvchilar uchun ishlaydi",
      });
    }

    // Referrer (chaqirgan) foydalanuvchini topish
    const referrer = await User.findOne({ telegramId: referrerTgId });
    if (!referrer)
      return res.status(404).json({ success: false, message: "Referrer topilmadi" });

    // Referral avval qo‘shilmaganligini tekshirish
    const alreadyReferred = await Referral.findOne({
      referrerTgId,
      referredTgId,
    });
    if (alreadyReferred) {
      return res.status(400).json({
        success: false,
        message: "Bu foydalanuvchi allaqachon referral orqali qo‘shilgan",
      });
    }

    // Referral yozuvini yaratish
    const referral = await Referral.create({
      referrerId: referrer._id,  // ✅ kerak bo‘lgan field
      referredId: null,          // ❗ yangi foydalanuvchi hali yaratilmagan
      referrerTgId,
      referredTgId,
    });

    res.status(201).json({
      success: true,
      message: "Referral muvaffaqiyatli qo‘shildi",
      referral,
    });
  } catch (error) {
    console.error("Referral qo‘shishda xato:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
};

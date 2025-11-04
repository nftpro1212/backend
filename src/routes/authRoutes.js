import express from "express";
import User from "../models/User.js";
import Referral from "../models/Referral.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { telegramId, username, first_name, last_name, avatar, referralCode } = req.body;

    if (!telegramId) {
      return res.status(400).json({ success: false, message: "Telegram ID kerak" });
    }

    // foydalanuvchi mavjudmi?
    let user = await User.findOne({ telegramId });

    if (!user) {
      // 🔹 referralCode bo‘lsa, referrer’ni topamiz
      let referredByUser = null;
      if (referralCode) {
        referredByUser = await User.findOne({ referralCode });
      }

      // 🔹 yangi foydalanuvchini yaratamiz
      user = new User({
        telegramId,
        username,
        first_name,
        last_name,
        avatar,
        referralCode: `ref_${telegramId}`, // har bir foydalanuvchiga unikal referral kodi
        referredBy: referredByUser ? referredByUser._id : null,
      });

      await user.save();

      // 🔹 agar referralCode to‘g‘ri bo‘lsa va o‘zi bilan teng bo‘lmasa — referral yozuvini yaratamiz
      if (referredByUser && referredByUser.telegramId !== telegramId) {
        const existingReferral = await Referral.findOne({
          referrerId: referredByUser._id,
          referredId: user._id,
        });

        if (!existingReferral) {
          await Referral.create({
            referrerId: referredByUser._id,
            referredId: user._id,
          });
        }
      }

      return res.status(201).json({
        success: true,
        message: "Yangi foydalanuvchi yaratildi",
        user,
      });
    }

    // 🔹 foydalanuvchi avval tizimga kirgan bo‘lsa
    res.status(200).json({
      success: true,
      message: "Foydalanuvchi tizimga kirdi (avval mavjud)",
      user,
    });

  } catch (err) {
    console.error("Login xatosi:", err);
    res.status(500).json({ success: false, message: "Server xatosi", error: err.message });
  }
});

export default router;

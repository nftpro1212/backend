import User from "../models/User.js";
import Referral from "../models/Referral.js";

/**
 * 🔹 Telegram WebApp orqali kirgan foydalanuvchini ro‘yxatdan o‘tkazish yoki login qilish
 */
export const handleTelegramLogin = async (req, res) => {
  try {
    const { telegramId, username, referralCode } = req.body;

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: "❌ telegramId majburiy",
      });
    }

    // 🔹 1. Foydalanuvchini topamiz yoki yaratamiz
    let user = await User.findOne({ telegramId });

    if (!user) {
      // Yangi user yaratamiz
      user = await User.create({
        telegramId,
        username: username || "no_username",
        referralCode: `ref_${Math.floor(Math.random() * 1000000)}`,
      });
      console.log(`🟢 Yangi foydalanuvchi yaratildi: ${user.username} (${telegramId})`);
    } else {
      // Username yangilash (agar o‘zgargan bo‘lsa)
      if (username && user.username !== username) {
        user.username = username;
        await user.save();
        console.log(`🟡 Username yangilandi: ${username} (${telegramId})`);
      } else {
        console.log(`🟢 Mavjud foydalanuvchi: ${user.username} (${telegramId})`);
      }
    }

    // 🔹 2. Referral tizimini tekshirish
    if (referralCode && referralCode.startsWith("ref_")) {
      const refUser = await User.findOne({ referralCode });

      if (refUser && refUser._id.toString() !== user._id.toString()) {
        const exists = await Referral.findOne({
          referrerId: refUser._id,
          referredId: user._id,
        });

        if (!exists) {
          await Referral.create({
            referrerId: refUser._id,
            referredId: user._id,
          });
          console.log(`🎉 Referral qo‘shildi: ${refUser.username} → ${user.username}`);
        }
      }
    }

    // 🔹 3. Javob qaytaramiz (frontend uchun)
    return res.status(200).json({
      success: true,
      message: "✅ Telegram orqali kirish muvaffaqiyatli",
      user,
    });
  } catch (error) {
    console.error("❌ Telegram login xatosi:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server xatosi",
    });
  }
};

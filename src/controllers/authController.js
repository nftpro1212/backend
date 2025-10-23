import User from "../models/User.js";
import Referral from "../models/Referral.js";

export const handleTelegramLogin = async (req, res) => {
  try {
    const {
      tgId,
      telegramId,
      username,
      first_name,
      last_name,
      avatar,
      referralCode,
    } = req.body;

    const finalTelegramId = tgId || telegramId;

    if (!finalTelegramId) {
      return res
        .status(400)
        .json({ success: false, message: "telegramId (tgId) majburiy" });
    }

    // 🔹 1. Foydalanuvchini topamiz yoki yaratamiz
    let user = await User.findOne({ telegramId: finalTelegramId });

    if (!user) {
      // 🆕 Yangi foydalanuvchi
      user = await User.create({
        telegramId: finalTelegramId,
        username: username || "no_username",
        first_name,
        last_name,
        avatar,
        referralCode: `ref_${Math.floor(100000 + Math.random() * 900000)}`,
      });

      console.log(`🟢 Yangi foydalanuvchi yaratildi: ${user.username} (${finalTelegramId})`);
    } else {
      // 🔄 Ma’lumotlar yangilanishi kerak bo‘lsa
      let updated = false;

      if (username && user.username !== username) {
        user.username = username;
        updated = true;
      }
      if (first_name && user.first_name !== first_name) {
        user.first_name = first_name;
        updated = true;
      }
      if (last_name && user.last_name !== last_name) {
        user.last_name = last_name;
        updated = true;
      }
      if (avatar && user.avatar !== avatar) {
        user.avatar = avatar;
        updated = true;
      }

      if (updated) {
        await user.save();
        console.log(`🟡 Foydalanuvchi ma'lumotlari yangilandi: ${username}`);
      } else {
        console.log(`🟢 Mavjud foydalanuvchi: ${user.username} (${finalTelegramId})`);
      }
    }

    // 🔹 2. Referral tizimi ishlashi
    if (referralCode && referralCode.startsWith("ref_")) {
      const referrer = await User.findOne({ referralCode });

      // O‘zini o‘zi taklif qilmasligi kerak
      if (referrer && referrer._id.toString() !== user._id.toString()) {
        const existingReferral = await Referral.findOne({
          referrerId: referrer._id,
          referredId: user._id,
        });

        if (!existingReferral) {
          await Referral.create({
            referrerId: referrer._id,
            referredId: user._id,
            referrerTgId: referrer.telegramId, // ✅ qo‘shildi
            referredTgId: user.telegramId,     // ✅ qo‘shildi
          });

          console.log(`🎉 Referral qo‘shildi: ${referrer.username} → ${user.username}`);
        } else {
          console.log(`⚠️ Referral allaqachon mavjud: ${referrer.username} → ${user.username}`);
        }
      } else {
        console.log(`⚠️ O‘zini o‘zi taklif qilgan yoki referrer topilmadi.`);
      }
    }

    // 🔹 3. Natija
    return res.status(200).json({
      success: true,
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

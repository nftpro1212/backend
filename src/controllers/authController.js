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

    // 🔹 Foydalanuvchini topamiz yoki yaratamiz
    let user = await User.findOne({ telegramId: finalTelegramId });

    if (!user) {
      user = new User({
        telegramId: finalTelegramId,
        username: username || "no_username",
        first_name,
        last_name,
        avatar,
        referralCode: `ref_${Math.floor(100000 + Math.random() * 900000)}`,
      });

      await user.save();
      console.log(`🟢 Yangi foydalanuvchi yaratildi: ${user.username} (${finalTelegramId})`);
    } else {
      // agar username yoki avatar o‘zgargan bo‘lsa, yangilaymiz
      let updated = false;

      if (username && user.username !== username) {
        user.username = username;
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

    // 🔹 Referral tizimi
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

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("❌ Telegram login xatosi:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server xatosi",
    });
  }
};

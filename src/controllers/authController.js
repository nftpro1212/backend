import User from "../models/User.js";
import Referral from "../models/Referral.js";

export const handleTelegramLogin = async (req, res) => {
  try {
    // 🔹 Frontenddan keladigan nomlar (tgId yoki telegramId)
    const { tgId, telegramId, username, referralCode } = req.body;
    const finalTelegramId = tgId || telegramId; // Qaysi biri kelsa, o‘shani ishlatamiz

    if (!finalTelegramId) {
      return res.status(400).json({ success: false, message: "telegramId (tgId) majburiy" });
    }

    // 🔹 Foydalanuvchini topamiz yoki yaratamiz
    let user = await User.findOne({ telegramId: finalTelegramId }); // ✅ to‘g‘risi shu

    if (!user) {
      user = new User({
        telegramId: finalTelegramId, // ✅ modeldagi nom bilan bir xil
        username: username || "no_username",
        referralCode: `ref_${Math.floor(Math.random() * 1000000)}`, // unikal kod
      });
      await user.save();
      console.log(`🟢 Yangi foydalanuvchi yaratildi: ${username || "no_username"} (${finalTelegramId})`);
    } else {
      // foydalanuvchi mavjud bo‘lsa, username yangilaymiz
      if (username && user.username !== username) {
        user.username = username;
        await user.save();
        console.log(`🟡 Username yangilandi: ${username} (${finalTelegramId})`);
      } else {
        console.log(`🟢 Mavjud foydalanuvchi topildi: ${user.username} (${finalTelegramId})`);
      }
    }

    // 🔹 Referral mavjud bo‘lsa, uni qayd etamiz
    if (referralCode && referralCode.startsWith("ref_")) {
      const refUser = await User.findOne({ referralCode: referralCode });
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

    // 🔹 Javob qaytaramiz
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("❌ Telegram login xatosi:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server xatosi",
    });
  }
};

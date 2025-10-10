import User from "../models/User.js";
import Referral from "../models/Referral.js";

export const handleTelegramLogin = async (req, res) => {
  try {
    const { tgId, telegramId, username, referralCode } = req.body;
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
        referralCode: `ref_${Math.floor(Math.random() * 1000000)}`,
      });
      await user.save();
      console.log(`🟢 Yangi foydalanuvchi yaratildi: ${user.username} (${finalTelegramId})`);
    } else {
      if (username && user.username !== username) {
        user.username = username;
        await user.save();
        console.log(`🟡 Username yangilandi: ${username} (${finalTelegramId})`);
      } else {
        console.log(`🟢 Mavjud foydalanuvchi: ${user.username} (${finalTelegramId})`);
      }
    }

    // 🔹 Referral tizimi
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

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("❌ Telegram login xatosi:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server xatosi",
    });
  }
};

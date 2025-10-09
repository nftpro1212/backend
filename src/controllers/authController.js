import User from "../models/User.js";
import Referral from "../models/Referral.js";

export const handleTelegramLogin = async (req, res) => {
  try {
    const { tgId, username, referralCode } = req.body;

    if (!tgId) {
      return res.status(400).json({ success: false, message: "tgId majburiy" });
    }

    // 🔹 Foydalanuvchini topamiz yoki yaratamiz
    let user = await User.findOne({ tgId });

    if (!user) {
      user = new User({
        tgId,
        username,
        referralCode: `ref_${Math.floor(Math.random() * 1000000)}`, // unikal kod
      });
      await user.save();
    } else {
      // foydalanuvchi mavjud bo‘lsa, username yangilaymiz
      if (username && user.username !== username) {
        user.username = username;
        await user.save();
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

          // optional: referalga bonus berish
          // refUser.balance += 1000; await refUser.save();
        }
      }
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("❌ Telegram login xatosi:", error);
    return res.status(500).json({ success: false, message: "Server xatosi" });
  }
};

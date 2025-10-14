import express from "express";
import User from "../models/User.js";
import Referral from "../models/Referral.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { telegramId, username, first_name, last_name, avatar, referralCode } = req.body;

    // foydalanuvchi mavjudmi?
    let user = await User.findOne({ telegramId });

    if (!user) {
      // referer topish (agar start_param keldi)
      let referredByUser = null;
      if (referralCode) {
        referredByUser = await User.findOne({ referralCode });
      }

      // yangi foydalanuvchi yaratish
      user = new User({
        telegramId,
        username,
        first_name,
        last_name,
        avatar,
        referralCode: `ref_${telegramId}`,
        referredBy: referredByUser ? referredByUser._id : null,
      });

      await user.save();

      // referal yozuvini yaratish
      if (referredByUser) {
        await Referral.create({
          referrerId: referredByUser._id,
          referredId: user._id,
        });
      }
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Login xatosi:", err);
    res.status(500).json({ success: false, message: "Server xatosi", error: err.message });
  }
});

export default router;

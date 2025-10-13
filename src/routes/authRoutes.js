import express from "express";
import User from "../models/User.js";
import Referral from "../models/Referral.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { tgId, username, first_name, last_name, refCode } = req.body;

    let user = await User.findOne({ tgId });
    if (!user) {
      user = await User.create({
        tgId,
        username,
        first_name,
        last_name,
        referralCode: `ref_${tgId}`,
      });
    }

    // Agar u referal orqali kirgan bo‘lsa
    if (refCode) {
      const referrer = await User.findOne({ referralCode: refCode });
      if (referrer && referrer._id.toString() !== user._id.toString()) {
        const exists = await Referral.findOne({
          referrerId: referrer._id,
          referredId: user._id,
        });
        if (!exists) {
          await Referral.create({
            referrerId: referrer._id,
            referredId: user._id,
          });
        }
      }
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Login xatosi:", err);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

export default router;

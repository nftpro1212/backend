import User from "../models/User.js";

export const handleTelegramLogin = async (req, res) => {
  try {
    const { tgId, username, first_name, last_name } = req.body;

    if (!tgId) {
      return res.status(400).json({ success: false, message: "Telegram ID topilmadi" });
    }

    let user = await User.findOne({ telegramId: tgId });

    if (!user) {
      user = await User.create({
        telegramId: tgId,
        username,
        first_name,
        last_name,
        referralCode: `ref_${Math.floor(100000 + Math.random() * 900000)}`,
      });
      console.log(`🟢 Yangi foydalanuvchi yaratildi: ${username || "no_username"}`);
    } else {
      console.log(`🟡 Foydalanuvchi mavjud: ${username}`);
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("❌ Login xatosi:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

import express from "express";
import User from "../models/User.js"; // MongoDB modeli
const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { id, first_name, last_name, username } = req.body;

    if (!id) return res.status(400).json({ message: "Telegram foydalanuvchisi aniqlanmadi" });

    // Avval mavjud foydalanuvchini qidiramiz
    let user = await User.findOne({ telegramId: id });

    // Agar topilmasa — yangi yaratamiz
    if (!user) {
      user = new User({
        telegramId: id,
        first_name,
        last_name,
        username,
        isPremium: false,
      });
      await user.save();
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Auth login xatosi:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
});

export default router;

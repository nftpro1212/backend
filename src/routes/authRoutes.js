import express from "express";
import User from "../models/User.js";

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Telegram orqali avtomatik login yoki ro‘yxatdan o‘tish
 * @access Public
 */
router.post("/login", async (req, res) => {
  try {
    const { telegramId, username, first_name, last_name, photo_url } = req.body;

    if (!telegramId)
      return res.status(400).json({ success: false, message: "telegramId required" });

    // Foydalanuvchini topamiz
    let user = await User.findOne({ telegramId });

    if (!user) {
      // Agar topilmasa yangi user yaratamiz
      user = await User.create({
        telegramId,
        username,
        firstName: first_name,
        lastName: last_name,
        photoUrl: photo_url,
      });
    } else {
      // Agar mavjud bo‘lsa, yangilab qo‘yamiz
      user.username = username || user.username;
      user.firstName = first_name || user.firstName;
      user.lastName = last_name || user.lastName;
      user.photoUrl = photo_url || user.photoUrl;
      await user.save();
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
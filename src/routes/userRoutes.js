import express from "express";
import User from "../models/User.js";

const router = express.Router();

/**
 * @route   POST /api/users/login
 * @desc    Telegram foydalanuvchisini avtomatik ro‘yxatdan o‘tkazish
 * @access  Public
 */
router.post("/login", async (req, res) => {
  try {
    const { telegramId, username, first_name, last_name, photo_url } = req.body;

    if (!telegramId) {
      return res.status(400).json({ success: false, message: "telegramId majburiy!" });
    }

    // Foydalanuvchini qidirish
    let user = await User.findOne({ telegramId });

    // Agar topilmasa — yangi foydalanuvchi yaratamiz
    if (!user) {
      user = await User.create({
        telegramId,
        username,
        first_name,
        last_name,
        photo_url,
        createdAt: new Date(),
        premium: false,
      });
    } else {
      // Username yoki ism o‘zgargan bo‘lsa yangilaymiz
      user.username = username || user.username;
      user.first_name = first_name || user.first_name;
      user.last_name = last_name || user.last_name;
      user.photo_url = photo_url || user.photo_url;
      await user.save();
    }

    res.json({
      success: true,
      message: "Foydalanuvchi tizimga kirdi yoki ro‘yxatdan o‘tdi",
      user,
    });
  } catch (error) {
    console.error("❌ Login xatosi:", error);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

/**
 * @route   GET /api/users/:telegramId
 * @desc    Foydalanuvchi ma’lumotlarini olish
 * @access  Public
 */
router.get("/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("❌ Foydalanuvchini olishda xato:", error);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

/**
 * @route   PATCH /api/users/:telegramId
 * @desc    Foydalanuvchini yangilash (masalan: premium holatini o‘zgartirish)
 * @access  Private
 */
router.patch("/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;
    const updates = req.body;

    const user = await User.findOneAndUpdate({ telegramId }, updates, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });
    }

    res.json({ success: true, message: "Foydalanuvchi yangilandi", user });
  } catch (error) {
    console.error("❌ Yangilashda xato:", error);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

export default router;

import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Telegram foydalanuvchisini avtomatik ro‘yxatdan o‘tkazish / tizimga kiritish
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

    // JWT token yaratish
    const token = jwt.sign(
      { id: user._id, telegramId: user.telegramId },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Foydalanuvchi tizimga kirdi yoki ro‘yxatdan o‘tdi",
      user,
      token,
    });
  } catch (error) {
    console.error("❌ Auth login xatosi:", error);
    res.status(500).json({ success: false, message: "Server xatosi" });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Token orqali foydalanuvchini olish
 * @access  Private
 */
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Token topilmadi" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecretkey");

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

    res.json({ success: true, user });
  } catch (error) {
    console.error("❌ Token xatosi:", error);
    res.status(401).json({ success: false, message: "Yaroqsiz token" });
  }
});

export default router;

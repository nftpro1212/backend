import express from "express";
import Reward from "../models/Reward.js";
import User from "../models/User.js"; // foydalanuvchini tekshirish uchun (agar kerak bo‘lsa)

const router = express.Router();

/**
 * @route   POST /api/rewards/save
 * @desc    Foydalanuvchiga mukofot yozish
 */
router.post("/save", async (req, res) => {
  try {
    const { telegramId, prize } = req.body;

    if (!telegramId || !prize) {
      return res.status(400).json({
        success: false,
        message: "telegramId va prize kiritilishi shart!",
      });
    }

    // Foydalanuvchi bazada bormi (ixtiyoriy)
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Foydalanuvchi topilmadi" });
    }

    // Yangi mukofot saqlash
    const reward = new Reward({ telegramId, prize });
    await reward.save();

    res.status(201).json({
      success: true,
      message: "Mukofot muvaffaqiyatli saqlandi",
      reward,
    });
  } catch (error) {
    console.error("❌ Reward saqlashda xato:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/rewards/history/:telegramId
 * @desc    Foydalanuvchining barcha mukofotlari tarixini olish
 */
router.get("/history/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;

    const rewards = await Reward.find({ telegramId }).sort({ createdAt: -1 });

    if (!rewards.length) {
      return res.status(404).json({
        success: false,
        message: "Bu foydalanuvchida hali mukofotlar yo‘q",
      });
    }

    res.status(200).json({ success: true, rewards });
  } catch (error) {
    console.error("❌ Tarix olishda xato:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

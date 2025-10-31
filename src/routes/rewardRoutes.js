import express from "express";
import Reward from "../models/Reward.js";
import User from "../models/User.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// 🔹 Telegram sozlamalari
const BOT_TOKEN = process.env.BOT_TOKEN; // .env faylda saqlanadi
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID; // Telegram guruh ID-si
const BOT_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

// 🎯 Sovgani saqlash (24 soatlik cheklov bilan)
router.post("/save", async (req, res) => {
  try {
    const { telegramId, prize } = req.body;
    if (!telegramId || !prize)
      return res.status(400).json({ error: "Maʼlumot to‘liq emas" });

    const user = await User.findOne({ telegramId });
    if (!user)
      return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

    const isPremium = user.premium?.isActive || false;
    const maxSpins = isPremium ? 3 : 1;

    // 🔹 Oxirgi 24 soatdagi spinlarni topamiz
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const spinsInLast24h = await Reward.countDocuments({
      telegramId,
      createdAt: { $gte: last24h },
    });

    if (spinsInLast24h >= maxSpins) {
      const lastReward = await Reward.findOne({ telegramId })
        .sort({ createdAt: -1 })
        .limit(1);
      const nextSpin = new Date(
        lastReward.createdAt.getTime() + 24 * 60 * 60 * 1000
      );
      return res.status(403).json({
        error: `Siz so‘nggi 24 soat ichida ${maxSpins} marta aylantirdingiz.`,
        nextSpin,
      });
    }

    // 🔹 Sovg‘ani saqlaymiz
    const reward = await Reward.create({ telegramId, prize });

    // 🔹 Guruhga xabar yuborish
    const message = `🎉 <b>${user.name || "Foydalanuvchi"}</b> spin aylantirib <b>${prize}</b> yutdi! 🏆`;
    try {
      await axios.post(BOT_API_URL, {
        chat_id: GROUP_CHAT_ID,
        text: message,
        parse_mode: "HTML",
      });
    } catch (botError) {
      console.error("Botga xabar yuborishda xatolik:", botError.message);
    }

    res.json({ success: true, reward });
  } catch (error) {
    console.error("Save reward error:", error);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// 📜 Tarixni olish
router.get("/history/:telegramId", async (req, res) => {
  try {
    const telegramId = req.params.telegramId;
    const user = await User.findOne({ telegramId });
    if (!user)
      return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

    const isPremium = user.premium?.isActive || false;
    const maxSpins = isPremium ? 3 : 1;

    const rewards = await Reward.find({ telegramId }).sort({ createdAt: -1 });
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const spinsInLast24h = await Reward.countDocuments({
      telegramId,
      createdAt: { $gte: last24h },
    });

    const remainingSpins = Math.max(maxSpins - spinsInLast24h, 0);

    let nextSpin = null;
    if (remainingSpins === 0 && rewards.length > 0) {
      const lastReward = rewards[0];
      nextSpin = new Date(lastReward.createdAt.getTime() + 24 * 60 * 60 * 1000);
    }

    res.json({
      rewards,
      isPremium,
      remainingSpins,
      nextSpin,
    });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ error: "Server xatosi" });
  }
});

export default router;

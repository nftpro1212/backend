// routes/rewardRoutes.js
import express from "express";
import Reward from "../models/Reward.js"; // mongoose modeli
const router = express.Router();

router.post("/save", async (req, res) => {
  try {
    const { telegramId, prize } = req.body;
    if (!telegramId || !prize)
      return res.status(400).json({ message: "Malumot to‘liq emas" });

    const reward = await Reward.create({
      telegramId,
      prize,
      date: new Date(),
    });

    res.json({ success: true, reward });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import SpinHistory from "../models/SpinHistory.js";

const prizes = [
  { name: "iPhone 15", probability: 0.001, type: "qimmat" },
  { name: "AirPods", probability: 0.02 },
  { name: "Smart soat", probability: 0.02 },
  { name: "100 000 so'm chegirma", probability: 0.03 },
  { name: "Omadsiz", probability: 0.2 },
  { name: "5 000 so'm bonus", probability: 0.1 },
  { name: "Qo'shimcha urinish", probability: 0.04 },
  { name: "10 000 so'm bonus", probability: 0.08 },
  { name: "20 000 so'm bonus", probability: 0.07 },
  { name: "Sovg‘a kartasi", probability: 0.05 },
  { name: "5% chegirma", probability: 0.1 },
  { name: "Omadsiz", probability: 0.25 },
];

export const spinWheel = async (req, res) => {
  const userId = req.user.id;
  const lastSpin = await SpinHistory.findOne({ userId }).sort({ date: -1 });

  // 24 soat cheklov
  if (lastSpin && Date.now() - lastSpin.date.getTime() < 24 * 60 * 60 * 1000) {
    return res.status(400).json({ message: "Siz faqat 24 soatda bir marta aylantira olasiz!" });
  }

  // Sovg‘ani ehtimol asosida tanlash
  const rand = Math.random();
  let sum = 0;
  let selected = prizes[prizes.length - 1];
  for (const prize of prizes) {
    sum += prize.probability;
    if (rand <= sum) {
      selected = prize;
      break;
    }
  }

  const spin = new SpinHistory({ userId, prize: selected.name });
  await spin.save();

  res.json({ success: true, prize: selected.name });
};

export const getHistory = async (req, res) => {
  const history = await SpinHistory.find({ userId: req.user.id }).sort({ date: -1 });
  res.json(history);
};
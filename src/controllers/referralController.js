import Referral from "../models/Referral.js";
import User from "../models/User.js";

// 🧩 Foydalanuvchining referallarini olish
export const getUserReferrals = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ message: "User topilmadi" });

    const referrals = await Referral.find({ referrerId: user._id }).populate("referredId", "username firstName");
    res.json({ count: referrals.length, list: referrals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🏆 Eng ko‘p referal qilgan top 10 foydalanuvchi
export const getLeaderboard = async (req, res) => {
  try {
    const top = await Referral.aggregate([
      { $group: { _id: "$referrerId", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          username: "$user.username",
          firstName: "$user.firstName",
          total: 1,
        },
      },
    ]);

    res.json(top);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

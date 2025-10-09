import User from "../models/User.js";
import Referral from "../models/Referral.js";

export const handleTelegramLogin = async (req, res) => {
  try {
    const { id, username, first_name, last_name, photo_url, referralCode } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Telegram foydalanuvchi ID (id) majburiy.",
      });
    }

    // 🔹 Foydalanuvchini bazadan topamiz
    let user = await User.findOne({ telegramId: id });

    // 🔹 Agar topilmasa — yangisini yaratamiz
    if (!user) {
      user = new User({
        telegramId: id,
        username: username || "",
        firstName: first_name || "",
        lastName: last_name || "",
        photoUrl: photo_url || "",
      });
      await user.save();
    } else {
      // mavjud foydalanuvchining ma'lumotlarini yangilaymiz
      let updated = false;

      if (username && user.username !== username) {
        user.username = username;
        updated = true;
      }
      if (first_name && user.firstName !== first_name) {
        user.firstName = first_name;
        updated = true;
      }
      if (last_name && user.lastName !== last_name) {
        user.lastName = last_name;
        updated = true;
      }
      if (photo_url && user.photoUrl !== photo_url) {
        user.photoUrl = photo_url;
        updated = true;
      }

      if (updated) await user.save();
    }

    // 🔹 Referral kod bo‘lsa, uni tekshiramiz
    if (referralCode && referralCode.startsWith("ref_")) {
      const refUser = await User.findOne({ referralCode });

      if (refUser && refUser._id.toString() !== user._id.toString()) {
        const exists = await Referral.findOne({
          referrerId: refUser._id,
          referredId: user._id,
        });

        if (!exists) {
          await Referral.create({
            referrerId: refUser._id,
            referredId: user._id,
          });

          // optional: referalga mukofot qo‘shish
          // refUser.isPremium = true;
          // await refUser.save();
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Telegram orqali muvaffaqiyatli kirildi!",
      user,
    });
  } catch (error) {
    console.error("❌ Telegram login xatosi:", error);
    return res.status(500).json({
      success: false,
      message: "Serverda xatolik yuz berdi",
      error: error.message,
    });
  }
};

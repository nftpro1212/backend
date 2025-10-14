import mongoose from "mongoose";
import { nanoid } from "nanoid"; // 🔹 Kod generatsiya qilish uchun (npm i nanoid)

const userSchema = new mongoose.Schema(
  {
    telegramId: { type: String, required: true, unique: true },
    username: String,
    first_name: String,
    last_name: String,
    avatar: String,

    // 🔹 referralCode endi avtomatik hosil bo‘ladi
    referralCode: {
      type: String,
      unique: true,
      default: () => nanoid(8), // masalan: "X7DK2A9P"
    },

    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    premium: {
      isActive: { type: Boolean, default: false },
      expiresAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

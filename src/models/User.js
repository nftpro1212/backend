import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    telegramId: { type: String, required: true, unique: true },
    username: String,
    first_name: String,
    last_name: String,
    avatar: String,

    referralCode: { type: String, unique: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    premium: {
      isActive: { type: Boolean, default: false },
      expiresAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

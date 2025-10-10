import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    telegramId: { type: Number, required: true, unique: true },
    username: { type: String },
    first_name: { type: String },
    last_name: { type: String },
    avatar: { type: String },
    referralCode: { type: String, unique: true },
    premium: {
      isActive: { type: Boolean, default: false },
      expiresAt: { type: Date },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

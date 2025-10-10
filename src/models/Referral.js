import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referrerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    referredId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Bir foydalanuvchi bir referrer orqali bir martadan ko‘p yozilmasligi
referralSchema.index({ referrerId: 1, referredId: 1 }, { unique: true });

export default mongoose.model("Referral", referralSchema);

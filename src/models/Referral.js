import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referrerTgId: { type: String, required: true }, // kim chaqirgan
    referredTgId: { type: String, required: true }, // kim chaqirilgan
  },
  { timestamps: true }
);

export default mongoose.model("Referral", referralSchema);

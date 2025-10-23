import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referrerTgId: {
      type: String,
      required: true,
    },
    referredTgId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Referral", referralSchema);

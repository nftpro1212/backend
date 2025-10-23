import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referredId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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

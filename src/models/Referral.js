import mongoose from "mongoose";

const referralSchema = new mongoose.Schema({
  inviter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  invited: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("Referral", referralSchema);

import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    telegramId: { type: String, required: true },
    prize: { type: String, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Reward", rewardSchema);

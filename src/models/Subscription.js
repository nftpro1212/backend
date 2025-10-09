import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  startDate: Date,
  endDate: Date,
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Subscription", subscriptionSchema);

import mongoose from "mongoose";

const spinHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  prize: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("SpinHistory", spinHistorySchema);
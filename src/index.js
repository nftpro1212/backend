import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import morgan from "morgan";

// 🔹 Custom modules
import connectDB from "./config/db.js";

// 🔹 Routes
import authRoutes from "./routes/authRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import prizeRoutes from "./routes/prizeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import rewardRoutes from "./routes/rewardRoutes.js";

// ✅ Express app
const app = express();

// ✅ Middleware
app.use(
  cors({
    origin: [
      "https://front0-v1wm.onrender.com", // ✅ WebApp frontend manzili
      "https://t.me", // Telegram ichidan kirishda
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// ✅ Database connection
connectDB(); // config/db.js ichida Mongo ulanishi

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/subscribe", subscriptionRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/prizes", prizeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/history", referralRoutes);
// ✅ Default route
app.get("/", (req, res) => {
  res.status(200).send({
    status: "success",
    message: "🚀 Telegram WebApp Backend ishlayapti!",
    version: "1.0.0",
  });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server ichki xatoligi",
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server http://localhost:${PORT} da ishga tushdi`);
});

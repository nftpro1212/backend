import express from "express";
import dotenv from "dotenv";
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

// 🔹 Load environment variables
dotenv.config();

// ✅ Express app
const app = express();

// ✅ Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*", // Frontend manzili
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" })); // JSON limit
app.use(morgan("dev")); // loglar

// ✅ Database connection
connectDB();

// ✅ API routes
app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/prizes", prizeRoutes);
app.use("/api/users", userRoutes);
// ✅ Default route
app.get("/", (req, res) => {
  res.status(200).send({
    status: "success",
    message: "🚀 Telegram WebApp Backend is running successfully!",
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
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

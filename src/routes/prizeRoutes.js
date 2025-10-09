import express from "express";
const router = express.Router();

router.get("/draw", (req, res) => {
  res.json({ winner: "Random User" });
});

export default router;

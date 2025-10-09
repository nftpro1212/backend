import express from "express";
const router = express.Router();

router.get("/leaderboard", (req, res) => {
  res.json([{ username: "Ali", referrals: 10 }]);
});

export default router;

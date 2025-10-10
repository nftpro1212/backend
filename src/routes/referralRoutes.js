import express from "express";
import { getUserReferrals, getLeaderboard } from "../controllers/referralController.js";
const router = express.Router();

router.get("/user/:telegramId", getUserReferrals);
router.get("/leaderboard", getLeaderboard);

export default router;

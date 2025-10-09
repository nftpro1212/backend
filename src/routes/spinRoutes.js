import express from "express";
import { spinWheel, getHistory } from "../controllers/spinController.js";
import { requirePremium } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/spin", requirePremium, spinWheel);
router.get("/history", requirePremium, getHistory);

export default router;
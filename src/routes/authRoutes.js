import express from "express";
import { handleTelegramLogin } from "../controllers/telegramController.js";

const router = express.Router();
router.post("/login", handleTelegramLogin);

export default router;

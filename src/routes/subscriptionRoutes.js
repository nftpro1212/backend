import express from "express";
const router = express.Router();

router.get("/:id", (req, res) => {
  res.json({ message: "Get subscription" });
});

router.post("/:id", (req, res) => {
  res.json({ message: "Create subscription" });
});

export default router;

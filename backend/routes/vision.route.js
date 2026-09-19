import express from "express";
import { analyzeScreen } from "../controllers/vision.controller.js";

const router = express.Router();

router.get("/screen", analyzeScreen);

export default router;

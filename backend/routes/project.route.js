import express from "express";
import { analyzeProject, getContext } from "../controllers/project.controller.js";

const router = express.Router();

router.get("/analyze", analyzeProject);
router.post("/context", getContext);

export default router;

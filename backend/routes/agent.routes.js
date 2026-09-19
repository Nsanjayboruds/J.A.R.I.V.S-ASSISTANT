import express from "express";
import { runAgent } from "../controllers/agent.controller.js";

const router = express.Router();

// POST /api/agent/run - Run autonomous developer agent loop
router.post("/run", runAgent);

export default router;

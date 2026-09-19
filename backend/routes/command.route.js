import express from "express";
import { executeCommand } from "../controllers/command.controller.js";

const router = express.Router();

router.post("/execute", executeCommand);

export default router;

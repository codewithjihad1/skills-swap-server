import express from "express";
import { findAiMatches } from "../controllers/matchmakingController.js";

const router = express.Router();

router.post("/", findAiMatches);

export default router;
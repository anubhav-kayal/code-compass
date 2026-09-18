import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import * as webhookController from "../controllers/webhookController";

export const webhookRoutes = Router();

webhookRoutes.post("/github", asyncHandler(webhookController.handleGithubWebhook));

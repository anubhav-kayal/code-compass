import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validateRequest";
import { asyncHandler } from "../middleware/asyncHandler";
import * as chatController from "../controllers/chatController";

export const chatRoutes = Router();

const chatSchema = z.object({
  repoId: z.string(),
  conversationId: z.string().optional(),
  message: z.string().min(1),
});

chatRoutes.post("/", validate(chatSchema), asyncHandler(chatController.sendMessage));
chatRoutes.get("/conversations", asyncHandler(chatController.listConversations));
chatRoutes.get("/conversations/:id", asyncHandler(chatController.getConversation));
chatRoutes.delete("/conversations/:id", asyncHandler(chatController.deleteConversation));

import { Router } from "express";
import { z } from "zod";
import { validate, objectIdSchema } from "../middleware/validateRequest";
import { asyncHandler } from "../middleware/asyncHandler";
import * as chatController from "../controllers/chatController";

export const chatRoutes = Router();

const chatSchema = z.object({
  repoId: objectIdSchema,
  conversationId: objectIdSchema.optional(),
  message: z.string().min(1).max(8000),
});

const listConversationsSchema = z.object({
  repoId: objectIdSchema.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

const idParamSchema = z.object({ id: objectIdSchema });

chatRoutes.post("/", validate(chatSchema), asyncHandler(chatController.sendMessage));
chatRoutes.get("/conversations", validate(listConversationsSchema, "query"), asyncHandler(chatController.listConversations));
chatRoutes.get("/conversations/:id", validate(idParamSchema, "params"), asyncHandler(chatController.getConversation));
chatRoutes.delete("/conversations/:id", validate(idParamSchema, "params"), asyncHandler(chatController.deleteConversation));

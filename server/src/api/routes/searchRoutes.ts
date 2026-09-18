import { Router } from "express";
import { z } from "zod";
import { validate, objectIdSchema } from "../middleware/validateRequest";
import { asyncHandler } from "../middleware/asyncHandler";
import * as searchController from "../controllers/searchController";

export const searchRoutes = Router();

const searchSchema = z.object({
  q: z.string().min(1),
  repoId: objectIdSchema,
  type: z.enum(["code", "symbol", "file"]).optional().default("code"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

const symbolSearchSchema = z.object({
  query: z.string().min(1),
  repoId: objectIdSchema,
});

searchRoutes.get("/", validate(searchSchema, "query"), asyncHandler(searchController.search));
searchRoutes.get("/symbols", validate(symbolSearchSchema, "query"), asyncHandler(searchController.searchSymbols));

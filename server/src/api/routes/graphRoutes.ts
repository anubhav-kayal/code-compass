import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validateRequest";
import { asyncHandler } from "../middleware/asyncHandler";
import * as graphController from "../controllers/graphController";

export const graphRoutes = Router();

const functionQuerySchema = z.object({
  function: z.string(),
  repoId: z.string(),
  depth: z.coerce.number().int().positive().optional().default(2),
});

graphRoutes.get("/callers", validate(functionQuerySchema, "query"), asyncHandler(graphController.getCallers));
graphRoutes.get("/callees", validate(functionQuerySchema, "query"), asyncHandler(graphController.getCallees));
graphRoutes.get("/dependencies", asyncHandler(graphController.getDependencies));
graphRoutes.get("/architecture", asyncHandler(graphController.getArchitecture));
graphRoutes.get("/impact", validate(functionQuerySchema, "query"), asyncHandler(graphController.getImpact));

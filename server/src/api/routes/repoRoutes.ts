import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validateRequest";
import { asyncHandler } from "../middleware/asyncHandler";
import * as repoController from "../controllers/repoController";

export const repoRoutes = Router();

const indexRepoSchema = z.object({
  githubUrl: z.string().url().includes("github.com"),
  branch: z.string().optional(),
});

repoRoutes.post("/", validate(indexRepoSchema), asyncHandler(repoController.indexRepo));
repoRoutes.get("/", asyncHandler(repoController.listRepos));
repoRoutes.get("/:id", asyncHandler(repoController.getRepo));
repoRoutes.delete("/:id", asyncHandler(repoController.deleteRepo));
repoRoutes.post("/:id/reindex", asyncHandler(repoController.reindexRepo));
repoRoutes.get("/:id/stats", asyncHandler(repoController.getRepoStats));

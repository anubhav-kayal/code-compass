import { Router } from "express";
import { z } from "zod";
import { validate, objectIdSchema } from "../middleware/validateRequest";
import { asyncHandler } from "../middleware/asyncHandler";
import * as repoController from "../controllers/repoController";
import { parseGithubUrl } from "../../utils/githubUrl";

export const repoRoutes = Router();

const indexRepoSchema = z.object({
  githubUrl: z
    .string()
    .refine((v) => parseGithubUrl(v) !== null, { message: "Must be a valid https://github.com/<owner>/<repo> URL" }),
  branch: z.string().max(255).optional(),
});

const idParamSchema = z.object({ id: objectIdSchema });

repoRoutes.post("/", validate(indexRepoSchema), asyncHandler(repoController.indexRepo));
repoRoutes.get("/", asyncHandler(repoController.listRepos));
repoRoutes.get("/:id", validate(idParamSchema, "params"), asyncHandler(repoController.getRepo));
repoRoutes.delete("/:id", validate(idParamSchema, "params"), asyncHandler(repoController.deleteRepo));
repoRoutes.post("/:id/reindex", validate(idParamSchema, "params"), asyncHandler(repoController.reindexRepo));
repoRoutes.get("/:id/stats", validate(idParamSchema, "params"), asyncHandler(repoController.getRepoStats));

import { Router } from "express";
import { repoRoutes } from "./repoRoutes";
import { chatRoutes } from "./chatRoutes";
import { searchRoutes } from "./searchRoutes";
import { graphRoutes } from "./graphRoutes";

export const apiRoutes = Router();

apiRoutes.use("/repos", repoRoutes);
apiRoutes.use("/chat", chatRoutes);
apiRoutes.use("/search", searchRoutes);
apiRoutes.use("/graph", graphRoutes);

apiRoutes.get("/health", (_req, res) => {
  res.json({ success: true, message: "Code-Compass API is running" });
});

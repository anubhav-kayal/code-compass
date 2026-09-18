import { Request, Response, NextFunction } from "express";
import { config } from "../../config";

/**
 * No-op when API_KEY is unset (default local dev setup). When set, every
 * /api request must send a matching `x-api-key` header.
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  if (!config.security.apiKey) {
    next();
    return;
  }

  const provided = req.header("x-api-key");
  if (provided !== config.security.apiKey) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  next();
}

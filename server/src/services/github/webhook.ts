import { Request } from "express";
import { config } from "../../config";

export function verifyWebhookSignature(req: Request, payload: string): boolean {
  const signature = req.headers["x-hub-signature-256"] as string;
  if (!signature || !config.github.webhookSecret) return false;

  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", config.github.webhookSecret);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export function parseWebhookEvent(req: Request): {
  event: string;
  repoFullName: string;
  ref?: string;
} {
  const event = req.headers["x-github-event"] as string;
  const body = req.body;

  return {
    event,
    repoFullName: body.repository?.full_name,
    ref: body.ref,
  };
}

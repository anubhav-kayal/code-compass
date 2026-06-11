const levels = ["debug", "info", "warn", "error"] as const;
type Level = (typeof levels)[number];

function log(level: Level, message: string, meta?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  if (meta) {
    console[level](`${prefix} ${message}`, JSON.stringify(meta));
  } else {
    console[level](`${prefix} ${message}`);
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};

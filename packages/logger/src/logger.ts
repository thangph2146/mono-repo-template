const PREFIX = "[workspace]";

function shouldLog(): boolean {
  try {
    return process.env.NODE_ENV === "development";
  } catch {
    return false;
  }
}

function formatArgs(level: string, args: unknown[]): unknown[] {
  if (!shouldLog()) return [];
  return [`${PREFIX}[${level}]`, ...args];
}

export const logger = {
  info(...args: unknown[]) {
    const formatted = formatArgs("info", args);
    if (formatted.length) console.info(...formatted);
  },
  warn(...args: unknown[]) {
    const formatted = formatArgs("warn", args);
    if (formatted.length) console.warn(...formatted);
  },
  error(...args: unknown[]) {
    const formatted = formatArgs("error", args);
    if (formatted.length) console.error(...formatted);
  },
  debug(...args: unknown[]) {
    const formatted = formatArgs("debug", args);
    if (formatted.length) console.debug(...formatted);
  },
};

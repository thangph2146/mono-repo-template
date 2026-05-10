#!/usr/bin/env node
/**
 * Cross-platform port killer.
 *
 *   node scripts/kill-ports.mjs 3000 3001 3002
 *
 * Why: Windows / Next.js dev servers occasionally leave a phantom listener
 * after a crash or Ctrl+C, then `pnpm dev` blows up with EADDRINUSE. Running
 * this once frees every requested port whether we are on Windows
 * (netstat + taskkill) or on macOS / Linux (lsof + kill). Missing ports are
 * silently skipped so it is safe to call before every dev launch.
 */

import { execSync } from "node:child_process";
import process from "node:process";

const ports = process.argv
  .slice(2)
  .flatMap((arg) => String(arg).split(","))
  .map((p) => Number(p.trim()))
  .filter((p) => Number.isInteger(p) && p > 0 && p < 65536);

if (ports.length === 0) {
  console.log("[kill-ports] no ports provided, nothing to do");
  process.exit(0);
}

const isWindows = process.platform === "win32";

/**
 * @param {string} cmd
 * @returns {string}
 */
const run = (cmd) => {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
};

/**
 * @param {number} port
 * @returns {string[]} list of PIDs listening on `port`
 */
const findPids = (port) => {
  if (isWindows) {
    const out = run(`netstat -ano -p tcp`);
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      // Sample line: TCP    0.0.0.0:3000   0.0.0.0:0   LISTENING   12345
      const parts = line.trim().split(/\s+/);
      if (parts.length < 5) continue;
      const local = parts[1];
      const state = parts[3];
      const pid = parts[4];
      if (state !== "LISTENING") continue;
      if (!local.endsWith(`:${port}`)) continue;
      if (pid && pid !== "0") pids.add(pid);
    }
    return [...pids];
  }
  const out = run(`lsof -ti tcp:${port} -sTCP:LISTEN`);
  return out ? out.split(/\s+/).filter(Boolean) : [];
};

/**
 * @param {string} pid
 */
const killPid = (pid) => {
  if (isWindows) {
    run(`taskkill /F /PID ${pid}`);
  } else {
    run(`kill -9 ${pid}`);
  }
};

let killed = 0;
for (const port of ports) {
  const pids = findPids(port);
  if (pids.length === 0) {
    console.log(`[kill-ports] :${port} đang trống`);
    continue;
  }
  for (const pid of pids) {
    killPid(pid);
    console.log(`[kill-ports] :${port} → kill PID ${pid}`);
    killed += 1;
  }
}

console.log(
  killed === 0
    ? "[kill-ports] không cần dọn cổng"
    : `[kill-ports] đã giải phóng ${killed} tiến trình`,
);

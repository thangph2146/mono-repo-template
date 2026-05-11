/**
 * PM2 ecosystem for Ubuntu deployment (store-sync monorepo).
 *
 * Prerequisites on server:
 * 1) Build artifacts are available (`pnpm -r build` or equivalent CI pipeline).
 * 2) API environment variables are provided via shell/.env (DB credentials, secrets, etc.).
 * 3) pm2 is installed globally: `npm i -g pm2`.
 */
module.exports = {
  apps: [
    {
      name: "store-sync-api",
      cwd: "./apps/api",
      script: "pnpm",
      args: "start:prod",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3002",
        SERVICE_NAME: "@api",
        CORS_ORIGINS: "http://localhost:3000,http://localhost:3001",
      },
    },
    {
      name: "store-sync-backend",
      cwd: "./apps/backend",
      script: "pnpm",
      args: "start -- -p 3001",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        NEXT_PUBLIC_API_URL: "http://localhost:3002/api",
      },
    },
    {
      name: "store-sync-frontend",
      cwd: "./apps/frontend",
      script: "pnpm",
      args: "start -- -p 3000",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        NEXT_PUBLIC_API_URL: "http://localhost:3002/api",
      },
    },
  ],
};

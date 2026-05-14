module.exports = {
  apps: [
    {
      name: "store-sync-api",
      cwd: "./apps/api",
      script: "pnpm",
      args: "run start:prod", 
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "store-sync-frontend",
      cwd: "./apps/frontend",
      script: "pnpm",
      args: "next start -p 3000", // Không dùng -- ở giữa nếu dùng trực tiếp command
    },
    {
      name: "store-sync-backend",
      cwd: "./apps/backend",
      script: "pnpm",
      args: "next start -p 3001",
    }
  ]
}
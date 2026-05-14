module.exports = {
  apps: [
    {
      name: "hub-parent-api",
      cwd: "./apps/api",
      script: "pnpm",
      args: "run start:prod", 
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "hub-parent-frontend",
      cwd: "./apps/frontend",
      script: "pnpm",
      args: "next start -p 3000", // Không dùng -- ở giữa nếu dùng trực tiếp command
    },
    {
      name: "hub-parent-backend",
      cwd: "./apps/backend",
      script: "pnpm",
      args: "next start -p 3001",
    }
  ]
}
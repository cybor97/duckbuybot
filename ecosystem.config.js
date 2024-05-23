module.exports = {
  apps: [
    {
      name: "duckbuybot-bot",
      exec_mode: "cluster",
      instances: 1,
      watch: true,
      autostart: true,
      max_memory_restart: "1G",

      interpreter: "ts-node",
      script: "src/index.ts",

      env: { EXEC_MODE: "bot" },
    },
    {
      name: "duckbuybot-cron",
      instances: 1,
      watch: true,
      autostart: true,
      max_memory_restart: "1G",

      interpreter: "ts-node",
      script: "src/index.ts",

      env: { EXEC_MODE: "cron" },
    },
  ],
};

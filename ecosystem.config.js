module.exports = {
  apps: [
    {
      name: "yalanelab",
      script: "server.ts",
      interpreter: "node",
      interpreter_args: "-r ts-node/register -r tsconfig-paths/register",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "/var/log/yalanelab/err.log",
      out_file: "/var/log/yalanelab/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};

const path = require("path");

module.exports = {
  apps: [
    {
      name: "yalanelab",
      // Build أولاً بـ next build، بعدين شغّل server.ts
      script: "./node_modules/.bin/ts-node",
      args: [
        "-r", "tsconfig-paths/register",
        "--compiler-options", '{"module":"commonjs"}',
        "server.ts"
      ],
      cwd: "/var/www/yalanelab",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "800M",
      error_file: "/var/log/yalanelab/err.log",
      out_file:   "/var/log/yalanelab/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      time: true,
      // Restart delay
      restart_delay: 3000,
      // Kill timeout
      kill_timeout: 5000,
    },
  ],
};

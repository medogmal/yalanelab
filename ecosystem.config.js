module.exports = {
  apps: [
    {
      name: "yalanelab",
      script: "./node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/yalanelab",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "800M",
      error_file: "/var/log/yalanelab/err.log",
      out_file: "/var/log/yalanelab/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      time: true,
      restart_delay: 3000,
      kill_timeout: 5000,
    },
  ],
};

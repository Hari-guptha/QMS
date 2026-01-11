module.exports = {
  apps: [
    {
      name: 'qms-backend',
      script: './dist/src/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 9001,
      },
      error_file: './logs/qms-backend-error.log',
      out_file: './logs/qms-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      wait_ready: true,
      listen_timeout: 10000,
    },
    {
      name: 'qms-fe',
      script: './server.js',
      cwd: './frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 9000,
      },
      error_file: './logs/qms-fe-error.log',
      out_file: './logs/qms-fe-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};


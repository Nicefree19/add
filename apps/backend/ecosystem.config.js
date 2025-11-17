module.exports = {
  apps: [
    {
      name: 'election-backend',
      script: './dist/main.js',
      instances: process.env.PM2_INSTANCES || 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',

      // 환경 변수
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
      },
      env_staging: {
        NODE_ENV: 'staging',
      },
      env_development: {
        NODE_ENV: 'development',
      },

      // 로그 설정
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // 재시작 설정
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,

      // 타임아웃 설정
      listen_timeout: 3000,
      kill_timeout: 5000,

      // 크론 재시작 (매일 새벽 4시)
      cron_restart: '0 4 * * *',

      // 인스턴스 설정
      instance_var: 'INSTANCE_ID',

      // 소스맵 지원
      source_map_support: true,

      // 모니터링
      pmx: true,
      automation: false,

      // Health check
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/election-system.git',
      path: '/opt/election-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --production && npx prisma generate && npx prisma migrate deploy && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production',
      },
    },
    staging: {
      user: 'deploy',
      host: 'your-staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/election-system.git',
      path: '/opt/election-backend-staging',
      'post-deploy': 'npm ci && npx prisma generate && npx prisma migrate deploy && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging',
      },
    },
  },
};

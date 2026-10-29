/**
 * PM2 Process Management Configuration for XYDV Platform
 * Target: AWS EC2 / Containerised Linux Environments
 */
const path = require('path');
const fs = require('fs');

const webDir = path.resolve(__dirname, 'apps/web');
const rootNextBin = path.resolve(__dirname, 'node_modules/next/dist/bin/next');
const webNextBin = path.resolve(webDir, 'node_modules/next/dist/bin/next');

// Dynamically resolve Next.js CLI binary across hoisted monorepo node_modules
const nextScript = fs.existsSync(webNextBin)
  ? 'node_modules/next/dist/bin/next'
  : fs.existsSync(rootNextBin)
  ? '../../node_modules/next/dist/bin/next'
  : 'node_modules/next/dist/bin/next';

module.exports = {
  apps: [
    {
      name: 'xydv-api',
      cwd: './apps/api',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-old-space-size=256',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      watch: false,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
    {
      name: 'xydv-web',
      cwd: './apps/web',
      script: nextScript,
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-old-space-size=384',
      max_memory_restart: '450M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      watch: false,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      kill_timeout: 5000,
    },
  ],
};

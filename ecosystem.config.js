// Deposit Worker - PM2 Ecosystem File
// Run with: pm2 start ecosystem.config.js

module.exports = {
    apps: [{
        name: 'deposit-worker',
        script: 'deposit-worker.ts',
        interpreter: 'npx',
        interpreterArgs: 'tsx',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '512M',
        env: {
            NODE_ENV: 'production'
        },
        error_file: './logs/deposit-worker-error.log',
        out_file: './logs/deposit-worker-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true
    }]
};

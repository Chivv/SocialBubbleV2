module.exports = {
  apps: [{
    name: 'socialbubble',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/home/ploi/platform.bubbleads.nl',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
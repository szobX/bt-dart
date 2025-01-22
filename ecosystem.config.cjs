module.exports = {
  apps: [
    {
      name: 'liga-dart',
      exec_mode: 'cluster',
      instances: '4',
      script: './.output/server/index.mjs',
      port: 3010,
      max_memory_restart: '256M',
    },
  ],
};

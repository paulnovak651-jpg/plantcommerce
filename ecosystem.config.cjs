module.exports = {
  apps: [
    {
      name: 'plantcommerce',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev --turbopack',
      cwd: 'C:\\Users\\Paul\\Desktop\\plantcommerce',
      interpreter: 'node',
      env: {
        NODE_ENV: 'development',
      },
      // Restart on crash but don't loop forever
      max_restarts: 5,
      min_uptime: '10s',
    },
  ],
};

/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
export default {
  /**
   * @name Development ortamı için proxy
   * @description Frontend (8000/8002) -> Backend (3001) proxy
   */
  dev: {
    // SSE endpoints - buffering kapalı
    '/api/admin/backup/stream': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      timeout: 600000,
      proxyTimeout: 600000,
      onProxyReq: (_proxyReq: any, _req: any, res: any) => {
        // SSE için buffering kapat
        res.setHeader('X-Accel-Buffering', 'no');
      },
      onProxyRes: (proxyRes: any, _req: any, _res: any) => {
        // SSE yanıtları için buffering kapalı
        proxyRes.headers['cache-control'] = 'no-cache';
        proxyRes.headers['x-accel-buffering'] = 'no';
      },
    },
    '/api/admin/restore/stream': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      timeout: 600000,
      proxyTimeout: 600000,
      onProxyReq: (_proxyReq: any, _req: any, res: any) => {
        res.setHeader('X-Accel-Buffering', 'no');
      },
      onProxyRes: (proxyRes: any, _req: any, _res: any) => {
        proxyRes.headers['cache-control'] = 'no-cache';
        proxyRes.headers['x-accel-buffering'] = 'no';
      },
    },
    // Normal API endpoints
    '/api/': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
      timeout: 600000, // 10 dakika
      proxyTimeout: 600000, // 10 dakika
    },
  },
  /**
   * @name 详细的代理配置
   * @doc https://github.com/chimurai/http-proxy-middleware
   */
  test: {
    // localhost:8000/api/** -> https://preview.pro.ant.design/api/**
    '/api/': {
      target: 'https://proapi.azurewebsites.net',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  pre: {
    '/api/': {
      target: 'your pre url',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
};

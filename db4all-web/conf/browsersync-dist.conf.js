const conf = require('./gulp.conf');
const proxyMiddleware = require('http-proxy-middleware');

module.exports = function () {
  return {
    server: {
      middleware: proxyMiddleware('/api', {target: 'http://localhost:9800', changeOrigin: true}),
      baseDir: [
        conf.paths.dist
      ]
    },
    open: false
  };
};

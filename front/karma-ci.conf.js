/**
 * Karma config extension used by the docker-compose `frontend-unit-tests`
 * service (and any CI running inside containers). The container executes as
 * root, so headless Chrome must be started with --no-sandbox.
 *
 * Supplying a custom --karma-config replaces the plugin list that the
 * Angular test builder generates automatically, so this file re-registers
 * all standard plugins plus the extra launcher:
 *
 *   npx ng test --watch=false \
 *     --karma-config=karma-ci.conf.js \
 *     --browsers=ChromeHeadlessNoSandbox
 */
module.exports = function (config) {
  config.set({
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    // Listen on all interfaces so the Karma server is reachable through
    // docker-compose port mappings (e.g. the watch-mode debug page at
    // http://localhost:9876/debug.html on the host).
    listenAddress: '0.0.0.0',
    hostname: 'localhost',
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
      }
    }
  });
};
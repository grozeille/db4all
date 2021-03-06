var jquery = require('jquery');
var angular = require('angular');

var datalakeToolboxModule = require('./app');

require('@uirouter/angularjs');

var routesConfig = require('./routes');

require('./index.css');

angular
  .module('app', [datalakeToolboxModule,
    'ui.router',
    'ui.router.modal'])
  .config(routesConfig);

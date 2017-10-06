var angular = require('angular');

require('angular-ui-bootstrap');
require('bootstrap/dist/css/bootstrap.min.css');

require('angular-ui-grid/ui-grid');
require('angular-ui-grid/ui-grid.css');
require('ui-select');
require('ui-select/dist/select.css');
require('ng-file-upload');
require('ng-tags-input/build/ng-tags-input.min');
require('ng-tags-input/build/ng-tags-input.min.css');
require('ng-tags-input/build/ng-tags-input.bootstrap.min.css');
require('angular-ui-router');
require('angular-ui-router-uib-modal');
require('angular-sanitize');
require('font-awesome-loader');
require('ace-builds/src-min-noconflict/ace');
require('angular-ui-ace');

angular
  .module('datalakeToolbox', [
    'ui.bootstrap',
    'ui.bootstrap.modal',
    'ui.select',
    'ui.grid',
    'ui.grid.resizeColumns',
    'ui.grid.autoResize',
    'ui.ace',
    'ngSanitize',
    'ngTagsInput',
    'ngFileUpload']);

require('./directives');
require('./services');
require('./controllers');

module.exports = 'datalakeToolbox';

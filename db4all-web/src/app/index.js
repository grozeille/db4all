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

require('handsontable/dist/moment/moment');
require('handsontable/dist/numbro/numbro');
require('handsontable/dist/numbro/languages');

require('handsontable/dist/pikaday/pikaday');
require('handsontable/dist/pikaday/pikaday.css');

require('handsontable/dist/handsontable.full');
require('handsontable/dist/handsontable.full.css');

require('ng-handsontable/dist/ngHandsontable');

require('angular-hotkeys/build/hotkeys.min');
require('angular-hotkeys/build/hotkeys.min.css');

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
    'ngFileUpload',
    'ngHandsontable',
    'cfp.hotkeys']);

require('./filters');
require('./directives');
require('./services');
require('./controllers');

module.exports = 'datalakeToolbox';

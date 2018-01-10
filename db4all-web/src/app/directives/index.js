'use strict';

var angular = require('angular');

angular.module('datalakeToolbox')
  .directive('queryBuilder', require('./queryBuilder/queryBuilder.directive'))
  .directive('queryBuilderFilter', require('./queryBuilderFilter/queryBuilderFilter.directive'))
  .directive('fillHeight', require('./fillHeight/fillHeight.directive'))
  .directive('navbar', require('./navbar/navbar.directive'))
  .directive('alertsPopup', require('./alertsPopup/alertsPopup.directive'))
  .directive('projectCard', require('./projectCard/projectCard.directive'))
  .directive('entityCard', require('./entityCard/entityCard.directive'))
  .directive('fieldEditor', require('./fieldEditor/fieldEditor.directive'))
  .directive('handsonTable', require('./handsonTable/handsonTable.directive'));

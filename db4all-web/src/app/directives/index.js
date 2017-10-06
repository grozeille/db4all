'use strict';

var angular = require('angular');

angular.module('datalakeToolbox')
  .directive('queryBuilder', require('./queryBuilder/queryBuilder.directive'))
  .directive('fileread', require('./fileread/fileread.directive'))
  .directive('fillHeight', require('./fillHeight/fillHeight.directive'))
  .directive('navbar', require('./navbar/navbar.directive'))
  .directive('alertsPopup', require('./alertsPopup/alertsPopup.directive'))
  .directive('datasetCard', require('./datasetCard/datasetCard.directive'));

'use strict';

var angular = require('angular');

angular.module('datalakeToolbox')
  .filter('filterFilter', require('./filterFilter/filterFilter.filter'));

'use strict';

var angular = require('angular');

angular.module('datalakeToolbox')
  .component('datasetControllerComponent', require('./dataset/dataset.controller'))
  .component('wranglingDataSetControllerComponent', require('./wranglingDataSet/wranglingDataSet.controller'))
  .component('wranglingDataSetLinksControllerComponent', require('./wranglingDataSet/links/links.controller'))
  .component('wranglingDataSetTableSelectionControllerComponent', require('./wranglingDataSetTableSelection/wranglingDataSetTableSelection.controller'))
  .component('customFileDataSetControllerComponent', require('./customFileDataSet/customFileDataSet.controller'))
  .component('viewDataSetControllerComponent', require('./viewDataSet/viewDataSet.controller'))
  .component('adminControllerComponent', require('./admin/admin.controller'))
  .component('profileControllerComponent', require('./profile/profile.controller'))
  .component('setupControllerComponent', require('./setup/setup.controller'))
  .component('projectControllerComponent', require('./project/project.controller'))
  .component('projectDetailControllerComponent', require('./projectDetail/projectDetail.controller'));


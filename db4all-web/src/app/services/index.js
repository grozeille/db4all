'use strict';

var angular = require('angular');

angular.module('datalakeToolbox')
  .service('hiveService', require('./hive/hive.service'))
  .service('dataSetService', require('./dataSet/dataSet.service'))
  .service('wranglingDataSetService', require('./wranglingDataSet/wranglingDataSet.service'))
  .service('customFileDataSetService', require('./customFileDataSet/customFileDataSet.service'))
  .service('viewDataSetService', require('./viewDataSet/viewDataSet.service'))
  .service('adminService', require('./admin/admin.service'))
  .service('projectService', require('./project/project.service'))
  .service('entityService', require('./entity/entity.service'))
  .service('userService', require('./user/user.service'))
  .service('handsonTableRegistryService', require('./handsonTableRegistry/handsonTableRegistry.service'));

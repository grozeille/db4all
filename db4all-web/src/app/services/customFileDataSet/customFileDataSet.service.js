module.exports = customFileDataSetService;

/** @ngInject */
function customFileDataSetService($log, $http, $location, $filter, $q, $rootScope, Upload, dataSetService, userService) {
  var vm = this;
  vm.apiHost = $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/api';

  vm.database = '';
  vm.table = '';
  vm.temporaryTable = '';
  vm.dataSetRequest = {
    comment: '',
    tags: []
  };
  vm.customFileDataSetConfig = {
    fileFormat: 'RAW',
    sheet: '',
    separator: '',
    textQualifier: '',
    firstLineHeader: true
  };
  vm.currentUser = null;

  vm.getServiceData = function(response) {
    return response.data;
  };

  vm.catchServiceException = function(error) {
    $log.error('XHR Failed.\n' + angular.toJson(error.data, true));
    throw error;
  };

  function initDataSet(database, table) {
    vm.database = database;
    vm.table = table;
    vm.dataSetRequest = null;
    vm.customFileDataSetConfig = null;

    return userService.getCurrent().then(function(data) {
      vm.currentUser = data;
      vm.temporaryTable = '_tmp_' + vm.currentUser.login + '_' + vm.table;
    })
    .then(function() {
      return dataSetService.getDataSet(vm.database, vm.table);
    })
    .then(function(data) {
      if(data === null) {
        // this table doesn't exist yet, create it first in "temporary" mode
        vm.dataSetRequest = {
          comment: '',
          tags: []
        };
        vm.customFileDataSetConfig = {
          fileFormat: 'RAW'
        };

        return saveDataSet(true);
      }
      else {
        // the table already exists, clone it as temporary table
        var url = vm.apiHost + '/dataset/custom-file/' + vm.database + '/' + vm.table + '/clone';

        var cloneRequest = {
          targetDatabase: vm.database,
          targetTable: vm.temporaryTable,
          temporary: true
        };

        return $http.post(url, cloneRequest)
          .then(function() {
            return dataSetService.getDataSet(vm.database, vm.temporaryTable);
          })
          .then(function(tmpData) {
            vm.dataSetRequest = {
              comment: tmpData.comment,
              tags: tmpData.tags
            };
            vm.customFileDataSetConfig = angular.fromJson(tmpData.dataSetConfiguration);
          });
      }
    })
    .catch(vm.catchServiceException);
  }

  function cloneDataSet(sourceDatabase, sourceTable, targetDatabase, targetTable) {
    vm.database = targetDatabase;
    vm.table = targetTable;
    vm.dataSetRequest = null;
    vm.customFileDataSetConfig = null;

    return userService.getCurrent().then(function(data) {
      vm.currentUser = data;
      vm.temporaryTable = '_tmp_' + vm.currentUser.login + '_' + vm.table;
    })
    .then(function() {
      // clone the source table as the temporary table
      var url = vm.apiHost + '/dataset/custom-file/' + sourceDatabase + '/' + sourceTable + '/clone';

      var cloneRequest = {
        targetDatabase: vm.database,
        targetTable: vm.temporaryTable,
        temporary: true
      };

      return $http.post(url, cloneRequest)
        .then(function() {
          return dataSetService.getDataSet(vm.database, vm.temporaryTable);
        })
        .then(function(tmpData) {
          vm.dataSetRequest = {
            comment: tmpData.comment,
            tags: tmpData.tags
          };
          vm.customFileDataSetConfig = angular.fromJson(tmpData.dataSetConfiguration);
        });
    })
    .catch(vm.catchServiceException);
  }

  function getTableName(temporary) {
    if(angular.isUndefined(temporary)) {
      temporary = false;
    }

    var table = vm.table;

    if(temporary) {
      table = vm.temporaryTable;
    }

    return table;
  }

  function saveDataSet(temporary) {
    var table = getTableName(temporary);

    var url = vm.apiHost + '/dataset/custom-file/' + vm.database + '/' + table;

    var creationRequest = {
      comment: vm.dataSetRequest.comment,
      tags: vm.dataSetRequest.tags,
      temporary: temporary,
      dataSetConfig: vm.customFileDataSetConfig
    };

    return $http.put(url, creationRequest)
      .catch(vm.catchServiceException);
  }

  function uploadFile(temporary, file) {
    var table = getTableName(temporary);

    var url = vm.apiHost + '/dataset/custom-file/' + vm.database + '/' + table + '/file';

    var upload = Upload.upload({
      url: url,
      data: {file: file},
      method: 'PUT'
    });

    return upload
      .catch(vm.catchServiceException);
  }

  function getData(maxLinePreview, useTablePrefix) {
    var url = vm.apiHost + '/dataset/' + vm.database + '/' + vm.temporaryTable + '/data?max=' + maxLinePreview + '&useTablePrefix=' + useTablePrefix;

    return $http.get(url)
      .then(vm.getServiceData)
      .catch(vm.catchServiceException);
  }

  function getExcelWorksheets() {
    var url = vm.apiHost + '/dataset/custom-file/' + vm.database + '/' + vm.temporaryTable + '/file/sheets';

    return $http.get(url)
      .then(vm.getServiceData)
      .catch(vm.catchServiceException);
  }

  function getDataSet() {
    return {
      database: vm.database,
      name: vm.table,
      comment: vm.dataSetRequest.comment,
      tags: vm.dataSetRequest.tags,
      dataSetConfig: vm.customFileDataSetConfig
    };
  }

  function setDataSet(dataSet) {
    vm.dataSetRequest = {
      comment: dataSet.comment,
      tags: dataSet.tags
    };

    vm.customFileDataSetConfig = dataSet.dataSetConfig;
  }

  var service = {
    initDataSet: initDataSet,
    cloneDataSet: cloneDataSet,
    saveDataSet: saveDataSet,
    uploadFile: uploadFile,
    getData: getData,
    getExcelWorksheets: getExcelWorksheets,
    getDataSet: getDataSet,
    setDataSet: setDataSet
  };

  return service;
}

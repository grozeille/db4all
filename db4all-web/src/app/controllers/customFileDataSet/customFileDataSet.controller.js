require('./customFileDataSet.css');
require('bootstrap-filestyle');

module.exports = {
  controller: CustomFileDataSetController,
  controllerAs: 'customFileDataSet',
  template: require('./customFileDataSet.html')
};

/** @ngInject */
function CustomFileDataSetController($timeout, $log, $location, $filter, $q, $scope, $state, $window, customFileDataSetService) {
  var vm = this;
  vm.isLoading = false;

  vm.alerts = [];

  vm.database = '';
  vm.name = '';
  vm.comment = '';
  vm.fileFormat = '';
  vm.csvSeparator = 'comma';
  vm.csvSeparatorCustom = '';
  vm.csvTextQualifier = 'doublequote';
  vm.csvFirstLineHeader = 'true';
  vm.fileInfo = {};
  vm.excelSheet = '';
  vm.excelSheets = [];
  vm.excelFirstLineHeader = 'true';
  vm.fileUploaded = false;
  vm.fileTemporaryUploaded = false;
  vm.maxLinePreview = 5000;
  vm.saving = false;

  vm.tags = [];

  vm.gridOptions = {
    enableSorting: false,
    enableColumnMenus: false,
    enableColumnResizing: true,
    appScopeProvider: vm,
    columnDefs: [],
    data: [],
    onRegisterApi: function(gridApi) {
      vm.gridSampleApi = gridApi;
    }
  };

  $scope.$watch(function(scope) {
    return(vm.fileInfo);
  }, function(newValue, oldValue) {
    if(newValue === null || angular.isUndefined(newValue.name)) {
      return;
    }

    if(newValue.name === oldValue.name && newValue.type === oldValue.type && newValue.size === oldValue.size && newValue.lastModified === oldValue.lastModified) {
      // same file, return
      return;
    }

    vm.fileUploaded = false;
    vm.fileTemporaryUploaded = false;

    var extension = newValue.name.split('.').pop();
    var extensionStart = extension.substr(0, 3);
    if(extensionStart.localeCompare('xls') === 0) {
      vm.fileFormat = 'EXCEL';
    }
    else if(extension.localeCompare('csv') === 0 || extension.localeCompare('tsv') === 0 || extension.localeCompare('txt') === 0) {
      vm.fileFormat = 'CSV';
    }
    else {
      vm.fileFormat = 'RAW';
    }
  });

  vm.getWorksheet = function() {
    return uploadFile(true).then(function() {
      return customFileDataSetService.getExcelWorksheets().then(function(data) {
        vm.excelSheets = data;
        if(vm.excelSheets.length > 0) {
          vm.excelSheet = vm.excelSheets[0];
        }
      });
    });
  };

  function setSeparator(separator) {
    if(separator === ';') {
      vm.csvSeparator = 'semicolon';
    } else if(separator === ',') {
      vm.csvSeparator = 'comma';
    } else if(separator === '\t') {
      vm.csvSeparator = 'tab';
    } else if(separator === ' ') {
      vm.csvSeparator = 'space';
    } else {
      vm.csvSeparator = 'custom';
      vm.csvSeparatorCustom = separator;
    }
  }

  function getSeparator() {
    var separator = '';
    if(vm.csvSeparator === 'semicolon') {
      separator = ';';
    } else if(vm.csvSeparator === 'comma') {
      separator = ',';
    } else if(vm.csvSeparator === 'tab') {
      separator = '\t';
    } else if(vm.csvSeparator === 'space') {
      separator = ' ';
    } else if(vm.csvSeparator === 'custom') {
      separator = vm.csvSeparatorCustom;
    }

    return separator;
  }

  function setTextQualifier(textQualifier) {
    if(textQualifier === '"') {
      vm.csvTextQualifier = 'doublequote';
    } else if(textQualifier === '\'') {
      vm.csvTextQualifier = 'simplequote';
    }
  }

  function getTextQualifier() {
    var textQualifier = '';
    if(vm.csvTextQualifier === 'doublequote') {
      textQualifier = '"';
    } else if(vm.csvTextQualifier === 'simplequote') {
      textQualifier = '\'';
    }
    return textQualifier;
  }

  function uploadFile(temporary) {
    // upload the file if not already deployed
    var fileUploaded = false;
    if(temporary) {
      fileUploaded = vm.fileTemporaryUploaded;
    }
    else {
      fileUploaded = vm.fileUploaded;
    }

    if(fileUploaded === false) {
      return customFileDataSetService.uploadFile(temporary, vm.fileInfo).then(function() {
        $log.info('File uploaded');
        if(temporary) {
          vm.fileTemporaryUploaded = true;
        }
        else {
          vm.fileUploaded = true;
        }
      });
    }
    else {
      return $q(function(resolve, reject) {
        $log.info('File already uploaded');
        resolve(null);
      });
    }
  }

  vm.preview = function() {
    vm.isLoading = true;
    vm.gridOptions.columnDefs = [];
    vm.gridOptions.data = [];

    var stopLoading = function() {
      $log.info('Stop loading');
      vm.isLoading = false;
    };

    return internalSave(true)
    .then(function() {
      $log.info('Parsing data...');
      return customFileDataSetService.getData(vm.maxLinePreview, false);
    })
    .then(function(data) {
      $log.info('Refresh data');
      if(data !== null) {
        vm.gridOptions.data = data.data;
      }
    })
    .then(stopLoading)
    .catch(function(error) {
      vm.alerts.push({msg: 'Unable to preview data table.', type: 'danger'});
      $log.error(error);
      throw error;
    })
    .catch(stopLoading);
  };

  function internalSave(temporary) {
    if(angular.isUndefined(temporary)) {
      temporary = false;
    }

    if(!temporary) {
      vm.saving = true;
    }

    var tags = [];
    for(var cpt = 0; cpt < vm.tags.length; cpt++) {
      tags.push(vm.tags[cpt].text);
    }

    var dataSet = {
      comment: vm.comment,
      tags: tags
    };

    if(vm.fileFormat === 'RAW') {
      dataSet.dataSetConfig = {
        fileFormat: 'RAW'
      };
    }
    else if(vm.fileFormat === 'CSV') {
      dataSet.dataSetConfig = {
        fileFormat: 'CSV',
        firstLineHeader: vm.csvFirstLineHeader === 'true',
        separator: getSeparator(),
        textQualifier: getTextQualifier()
      };
    }
    else if(vm.fileFormat === 'EXCEL') {
      dataSet.dataSetConfig = {
        fileFormat: 'EXCEL',
        firstLineHeader: vm.excelFirstLineHeader === 'true',
        sheet: vm.excelSheet
      };
    }

    customFileDataSetService.setDataSet(dataSet);

    return customFileDataSetService.saveDataSet(temporary)
      .then(function() {
        return uploadFile(temporary);
      });
  }

  vm.save = function(temporary) {
    return internalSave(temporary)
      .then(function() {
        $log.info('DataSet saved...');
        vm.saving = false;
        vm.alerts.push({msg: 'DataSet saved.', type: 'info'});
      })
      .catch(function(error) {
        $log.info('Error...');
        vm.saving = false;
        vm.alerts.push({msg: 'Unable to save the DataSet.', type: 'danger'});
        $log.error(error);
        throw error;
      });
  };

  function activate() {
    var dataSet = customFileDataSetService.getDataSet();
    vm.database = dataSet.database;
    vm.name = dataSet.name;
    vm.comment = dataSet.comment;
    vm.fileFormat = dataSet.dataSetConfig.fileFormat;

    vm.tags = [];
    for(var cpt = 0; cpt < dataSet.tags.length; cpt++) {
      vm.tags.push({text: dataSet.tags[cpt]});
    }

    if(dataSet.dataSetConfig.fileFormat === 'RAW') {
      // do nothing
    }
    else if(dataSet.dataSetConfig.fileFormat === 'CSV') {
      setSeparator(dataSet.dataSetConfig.separator);
      setTextQualifier(dataSet.dataSetConfig.textQualifier);
      if(dataSet.dataSetConfig.firstLineHeader) {
        vm.csvFirstLineHeader = 'true';
      }
      else {
        vm.csvFirstLineHeader = 'false';
      }
    }
    else if(dataSet.dataSetConfig.fileFormat === 'EXCEL') {
      if(dataSet.dataSetConfig.firstLineHeader) {
        vm.excelFirstLineHeader = 'true';
      }
      else {
        vm.excelFirstLineHeader = 'false';
      }
      vm.excelSheet = dataSet.dataSetConfig.sheet;
    }

    $(':file').filestyle();

    if(angular.isDefined(dataSet.dataSetConfig.originalFile) && angular.isDefined(dataSet.dataSetConfig.originalFile.path)) {
      var path = dataSet.dataSetConfig.originalFile.path;
      var lastIndex = path.lastIndexOf('/');
      var fileName = path.substring(lastIndex + 1);
      var timeStampInMs = $window.performance && $window.performance.now && $window.performance.timing && $window.performance.timing.navigationStart ? $window.performance.now() + $window.performance.timing.navigationStart : Date.now();

      vm.fileInfo = {
        name: fileName,
        size: dataSet.dataSetConfig.originalFile.size,
        type: dataSet.dataSetConfig.originalFile.contentType,
        lastModified: timeStampInMs
      };
      $(':file').filestyle('placeholder', fileName);
      vm.fileUploaded = true;
      vm.fileTemporaryUploaded = true;
    }
  }

  activate();
}

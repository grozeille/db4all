module.exports = {
  controller: CloneDataSetController,
  controllerAs: 'cloneDataSet',
  template: require('./cloneDataSet.html')
};

/** @ngInject */
function CloneDataSetController($uibModalInstance, $log, $state, wranglingDataSetService, customFileDataSetService, userService, dataSetService, sourceDatabase, sourceTable, dataSetType) {
  var vm = this;

  vm.database = '';
  vm.name = '';
  vm.sourceDatabase = sourceDatabase;
  vm.sourceTable = sourceTable;
  vm.dataSetType = dataSetType;
  vm.showTableAlreadyExistError = false;
  vm.cloning = false;

  vm.ok = function() {
    vm.showTableAlreadyExistError = false;

    dataSetService.getDataSet(vm.database, vm.name).then(function(data) {
      if(data === null) {
        vm.cloning = true;
        if(vm.dataSetType === 'WranglingDataSet') {
          wranglingDataSetService.cloneDataSet(sourceDatabase, sourceTable, vm.database, vm.name).then(function() {
            $uibModalInstance.close();
            $state.go('wranglingDataSet');
          });
        }
        else if(vm.dataSetType === 'CustomFileDataSet') {
          customFileDataSetService.cloneDataSet(sourceDatabase, sourceTable, vm.database, vm.name).then(function() {
            $uibModalInstance.close();
            $state.go('customFileDataSet');
          });
        }
      }
      else {
        vm.showTableAlreadyExistError = true;
      }
    });
  };

  vm.cancel = function() {
    $log.info('Modal dismissed at: ' + new Date());
    $uibModalInstance.dismiss();
  };

  function activate() {
    userService.getLastProject().then(function(data) {
      vm.database = data.hiveDatabase;
    });
  }

  activate();
}

module.exports = {
  controller: ChooseDataSetTypeController,
  controllerAs: 'chooseDataSetType',
  template: require('./chooseDataSetType.html')
};

/** @ngInject */
function ChooseDataSetTypeController($uibModalInstance, $log, $state, wranglingDataSetService, customFileDataSetService, userService, dataSetService) {
  var vm = this;

  vm.dataSetType = '';
  vm.page = 1;
  vm.database = '';
  vm.name = '';
  vm.showTableAlreadyExistError = false;
  vm.loading = false;

  vm.nextPage = function() {
    userService.getLastProject().then(function(data) {
      vm.database = data.hiveDatabase;
      vm.page = 2;
    });
  };

  vm.wrangleDataSet = function() {
    vm.dataSetType = 'wranglingDataSet';
    vm.nextPage();
  };

  vm.fileDataSet = function() {
    vm.dataSetType = 'customFileDataSet';
    vm.nextPage();
  };

  vm.ok = function() {
    vm.showTableAlreadyExistError = false;
    vm.loading = true;

    dataSetService.getDataSet(vm.database, vm.name).then(function(data) {
      if(data === null) {
        if(vm.dataSetType === 'wranglingDataSet') {
          wranglingDataSetService.initDataSet(vm.database, vm.name).then(function() {
            vm.loading = false;
            $uibModalInstance.close();
            $state.go('wranglingDataSet');
          });
        }
        else if(vm.dataSetType === 'customFileDataSet') {
          customFileDataSetService.initDataSet(vm.database, vm.name).then(function() {
            vm.loading = false;
            $uibModalInstance.close();
            $state.go('customFileDataSet');
          });
        }
      }
      else {
        vm.showTableAlreadyExistError = true;
        vm.loading = false;
      }
    });
  };

  vm.cancel = function() {
    $log.info('Modal dismissed at: ' + new Date());
    $uibModalInstance.dismiss();
  };
}

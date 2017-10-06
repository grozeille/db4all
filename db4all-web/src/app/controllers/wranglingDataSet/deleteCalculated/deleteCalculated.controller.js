module.exports = {
  controller: DeleteCalculatedController,
  controllerAs: 'deleteCalculated',
  template: require('./deleteCalculated.html')
};

/** @ngInject */
function DeleteCalculatedController($timeout, $log, $location, $filter, $uibModalInstance, $state, columnName, wranglingDataSetService) {
  var vm = this;
  vm.column = wranglingDataSetService.getCalculatedColumn(columnName);

  vm.ok = function() {
    $log.info('Modal OK at: ' + new Date());

    wranglingDataSetService.removeCalculatedColumn(vm.column.name);

    $uibModalInstance.close();
  };

  vm.cancel = function() {
    $log.info('Modal dismissed at: ' + new Date());
    $uibModalInstance.dismiss();
  };
}

module.exports = {
  controller: DeleteTableController,
  controllerAs: 'deleteTable',
  template: require('./deleteTable.html')
};

/** @ngInject */
function DeleteTableController($timeout, $log, $location, $filter, $uibModalInstance, $state, database, table, wranglingDataSetService) {
  var vm = this;
  vm.table = wranglingDataSetService.getTable(database, table);

  vm.ok = function() {
    $log.info('Modal OK at: ' + new Date());

    wranglingDataSetService.removeTable(vm.table.database, vm.table.table);

    $uibModalInstance.close();
  };

  vm.cancel = function() {
    $log.info('Modal dismissed at: ' + new Date());
    $uibModalInstance.dismiss();
  };
}

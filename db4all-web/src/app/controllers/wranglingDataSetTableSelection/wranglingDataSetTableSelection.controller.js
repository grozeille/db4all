require('./wranglingDataSetTableSelection.css');

module.exports = {
  controller: WranglingDataSetTableSelectionController,
  controllerAs: 'wranglingDataSetTableSelection',
  template: require('./wranglingDataSetTableSelection.html')
};

/** @ngInject */
function WranglingDataSetTableSelectionController($timeout, $log, $location, $filter, $state, wranglingDataSetService, dataSetService) {
  var vm = this;
  vm.sourceFilter = '';
  vm.dataSetList = [];
  vm.pageResult = {
    totalElements: 0,
    totalPages: 0,
    last: true,
    first: true
  };
  vm.currentPage = 1;
  vm.itemsPerPage = 12;

  vm.selectTable = function(database, table) {
    var selectedTable = $filter('filter')(vm.dataSetList, {database: database, table: table})[0];

    wranglingDataSetService.addTable(selectedTable);
    $state.go('wranglingDataSet');
  };

  vm.loadAllDataSet = function() {
    dataSetService.getAllDataSet(vm.sourceFilter, vm.currentPage - 1, vm.itemsPerPage).then(function(data) {
      vm.dataSetList = data.content;
      vm.pageResult = {
        totalElements: data.totalElements,
        last: data.last,
        first: data.first,
        totalPages: data.totalPages
      };
      for(var cpt = 0; cpt < vm.dataSetList.length; cpt++) {
        if(vm.dataSetList[cpt].dataSetType === 'PublicDataSet') {
          vm.dataSetList[cpt].headerClass = 'dataset-card-header-blue';
        }
        else if(vm.dataSetList[cpt].dataSetType === 'CustomFileDataSet') {
          vm.dataSetList[cpt].headerClass = 'dataset-card-header-green';
        }
        else if(vm.dataSetList[cpt].dataSetType === 'WranglingDataSet') {
          vm.dataSetList[cpt].headerClass = 'dataset-card-header-orange';
        }
      }
    });
  };

  function activate() {
    vm.loadAllDataSet();
  }

  activate();
}

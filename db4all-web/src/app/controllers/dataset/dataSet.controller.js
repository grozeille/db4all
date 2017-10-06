require('./dataset.css');

module.exports = {
  controller: DatasetController,
  controllerAs: 'dataset',
  template: require('./dataset.html')
};

/** @ngInject */
function DatasetController($timeout, $log, $location, $filter, $uibModal, $state, dataSetService, wranglingDataSetService, customFileDataSetService, viewDataSetService) {
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
  vm.itemsPerPage = 11;

  function getDataSet(database, table) {
    var selectedDataSet = null;
    for(var cpt = 0; cpt < vm.dataSetList.length; cpt++) {
      if(vm.dataSetList[cpt].database === database && vm.dataSetList[cpt].table === table) {
        selectedDataSet = vm.dataSetList[cpt];
        break;
      }
    }
    return selectedDataSet;
  }

  vm.createNewDataSet = function() {
    vm.chooseDataSetType();
  };

  vm.viewDataSet = function(database, table) {
    var selectedDataSet = getDataSet(database, table);

    if(selectedDataSet !== null) {
      selectedDataSet.viewLoading = true;
      viewDataSetService.initDataSet(database, table).then(function() {
        $state.go('viewDataSet');
      });
    }
  };

  vm.editDataSet = function(database, table) {
    var selectedDataSet = getDataSet(database, table);

    if(selectedDataSet !== null) {
      selectedDataSet.editLoading = true;
      if(selectedDataSet.dataSetType === 'CustomFileDataSet') {
        customFileDataSetService.initDataSet(database, table).then(function() {
          $state.go('customFileDataSet');
        });
      }
      else if(selectedDataSet.dataSetType === 'WranglingDataSet') {
        wranglingDataSetService.initDataSet(database, table).then(function() {
          $state.go('wranglingDataSet');
        });
      }
    }
  };

  vm.deleteDataSet = function(database, table) {
    dataSetService.getDataSet(database, table).then(function(data) {
      $uibModal.open({
        templateUrl: 'delete.html',
        controllerAs: 'delete',
        controller: function($uibModalInstance, dataSetName, parent) {
          var vm = this;
          vm.dataSetName = dataSetName;
          vm.ok = function() {
            dataSetService.deleteDataSet(database, table).then(function() {
              $uibModalInstance.close();
              parent.loadAllDataSet();
            });
          };
          vm.cancel = function() {
            $uibModalInstance.dismiss('cancel');
          };
        },
        resolve: {
          dataSetName: function () {
            return database + '.' + table;
          },
          parent: function() {
            return vm;
          }
        }
      });
    });
  };

  var cloneDataSetModal = require('./cloneDataSet/cloneDataSet.controller');

  vm.cloneDataSet = function(database, table) {
    var selectedDataSet = getDataSet(database, table);

    cloneDataSetModal.resolve = {
      sourceDatabase: function() {
        return database;
      },
      sourceTable: function() {
        return table;
      },
      dataSetType: function() {
        return selectedDataSet.dataSetType;
      }
    };

    $uibModal.open(cloneDataSetModal);
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
        vm.dataSetList[cpt].editLoading = false;
        vm.dataSetList[cpt].viewLoading = false;
        vm.dataSetList[cpt].showEditionButtons = vm.dataSetList[cpt].dataSetType !== 'PublicDataSet';

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

  var chooseDataSetTypeModal = require('./chooseDataSetType/chooseDataSetType.controller');

  vm.chooseDataSetType = function() {
    $uibModal.open(chooseDataSetTypeModal);
  };

  function activate() {
    vm.loadAllDataSet();
  }

  activate();
}

require('./entity.css');

module.exports = {
  controller: EntityController,
  controllerAs: 'entity',
  template: require('./entity.html')
};

/** @ngInject */
function EntityController($timeout, $log, $location, $filter, $uibModal, $state, $stateParams, entityService) {
  var vm = this;

  vm.projectId = $stateParams.projectId;

  vm.sourceFilter = '';
  vm.entityList = [];
  vm.pageResult = {
    totalElements: 0,
    totalPages: 0,
    last: true,
    first: true
  };
  vm.currentPage = 1;
  vm.itemsPerPage = 11;

  function getEntity(id) {
    var result = null;
    for(var cpt = 0; cpt < vm.entityList.length; cpt++) {
      if(vm.entityList[cpt].id === id) {
        result = vm.entityList[cpt];
        break;
      }
    }
    return result;
  }

  vm.createNewEntity = function() {
    $state.go('entityDetail', {projectId: vm.projectId, id: ''});
  };

  vm.editEntity = function(id) {
    $state.go('entityDetail', {projectId: vm.projectId, id: id});
  };

  vm.viewEntity = function(id) {
    $state.go('entityData', {projectId: vm.projectId, id: id});
  };

  vm.deleteEntity = function(id) {
    var entity = getEntity(id);
    var projectId = vm.projectId;

    $uibModal.open({
      templateUrl: 'delete.html',
      controllerAs: 'delete',
      controller: function($uibModalInstance, entityName, parent) {
        var vm = this;
        vm.entityName = entityName;
        vm.ok = function() {
          entityService.remove(projectId, id).then(function() {
            $uibModalInstance.close();
            parent.loadAllEntities();
          });
        };
        vm.cancel = function() {
          $uibModalInstance.dismiss('cancel');
        };
      },
      resolve: {
        entityName: function () {
          return entity.name;
        },
        parent: function() {
          return vm;
        }
      }
    });
  };

  vm.loadAllEntities = function() {
    entityService.getAllEntities(vm.projectId, vm.sourceFilter, vm.currentPage - 1, vm.itemsPerPage).then(function(data) {
      vm.entityList = data.content;
      vm.pageResult = {
        totalElements: data.totalElements,
        last: data.last,
        first: data.first,
        totalPages: data.totalPages
      };
      for(var cpt = 0; cpt < vm.entityList.length; cpt++) {
        vm.entityList[cpt].editLoading = false;
        vm.entityList[cpt].viewLoading = false;
      }
    });
  };

  function activate() {
    vm.loadAllEntities();
  }

  activate();
}

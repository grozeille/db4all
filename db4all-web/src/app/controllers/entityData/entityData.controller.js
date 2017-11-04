require('./entityData.css');

module.exports = {
  controller: EntityDataController,
  controllerAs: 'entityData',
  template: require('./entityData.html')
};

/** @ngInject */
function EntityDataController($log, $uibModal, $stateParams, entityService) {
  var vm = this;

  vm.alerts = [];

  vm.projectId = $stateParams.projectId;
  vm.entityId = $stateParams.id;
  vm.entity = {
    id: '',
    name: '',
    comment: '',
    tags: [],
    fields: []
  };
  vm.data = [];
  vm.settings = {
    manualColumnResize: true,
    contextMenu: ['row_above', 'row_below', 'remove_row']
  };

  vm.refresh = function() {
    entityService.getById(vm.projectId, vm.entityId)
      .then(function(entity) {
        vm.entity = entity;
        if(angular.isUndefined(vm.entity.fields) || vm.entity.fields === null) {
          vm.entity.fields = [];
        }
        return entityService.getData(vm.projectId, vm.entityId).then(function (data) {
          vm.data = data;
        });
      })
      .catch(function(error) {
        vm.alerts.push({msg: 'Unable to get entity ' + vm.entityId + '.', type: 'danger'});
        throw error;
      });
  };

  vm.save = function() {
    entityService.saveData(vm.projectId, vm.entityId, vm.data)
    .then(function(request) {
      vm.alerts.push({msg: 'Entity saved.', type: 'info'});
    })
    .catch(function(error) {
      vm.alerts.push({msg: 'Unable to save entity ' + vm.entityId + '.', type: 'danger'});
      throw error;
    });
  };

  function activate() {
    vm.refresh();
  }

  activate();
}

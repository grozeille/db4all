module.exports = {
  controller: LinksController,
  controllerAs: 'links',
  template: require('./links.html')
};

/** @ngInject */
function LinksController($timeout, $log, $location, $filter, $uibModalInstance, entityService, projectId, entityId, links) {
  var vm = this;

  vm.alerts = [];

  vm.links = links;
  vm.projectId = projectId;
  vm.entityId = entityId;

  vm.entity = {
    id: '',
    name: '',
    comment: '',
    tags: [],
    fields: []
  };
  vm.filteredData = [];
  vm.data = [];
  vm.columns = [];
  vm.settings = {
    manualColumnResize: true,
    readOnly: true
  };

  vm.refresh = function() {
    entityService.getById(vm.projectId, vm.entityId)
      .then(function(entity) {
        vm.entity = entity;
        if(angular.isUndefined(vm.entity.fields) || vm.entity.fields === null) {
          vm.entity.fields = [];
        }

        vm.columns = [];
        for(var cptField in vm.entity.fields) {
          var field = vm.entity.fields[cptField];
          var column = {
            name: field.name
          };

          vm.columns.push(column);
        }

        return entityService.getData(vm.projectId, vm.entityId).then(function (data) {
          vm.data = data;
          vm.filteredData = vm.data;
        });
      })
      .catch(function(error) {
        vm.alerts.push({msg: 'Unable to get entity ' + vm.entityId + '.', type: 'danger'});
        throw error;
      });
  };

  vm.ok = function() {
    $log.info('Modal OK at: ' + new Date());

    $uibModalInstance.close();
  };

  vm.cancel = function() {
    $log.info('Modal dismissed at: ' + new Date());
    $uibModalInstance.dismiss();
  };

  activate();

  function activate() {
    vm.refresh();
  }
}

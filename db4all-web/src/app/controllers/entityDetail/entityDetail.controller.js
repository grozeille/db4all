require('./entityDetail.css');

module.exports = {
  controller: EntityDetailController,
  controllerAs: 'entityDetail',
  template: require('./entityDetail.html')
};

/** @ngInject */
function EntityDetailController($log, $uibModal, $stateParams, entityService) {
  var vm = this;

  vm.alerts = [];

  vm.projectId = $stateParams.projectId;
  vm.entityId = $stateParams.id;
  vm.entity = {
    id: '',
    name: '',
    comment: '',
    tags: []
  };
  vm.tags = [];

  vm.refresh = function() {
    if(vm.entityId !== '') {
      entityService.getById(vm.projectId, vm.entityId)
        .then(function(data) {
          vm.entity = data;
          vm.tags = [];
          for(var cpt = 0; cpt < vm.entity.tags.length; cpt++) {
            vm.tags.push({text: vm.entity.tags[cpt]});
          }
        })
        .catch(function(error) {
          vm.alerts.push({msg: 'Unable to get entity ' + vm.entityId + '.', type: 'danger'});
          throw error;
        });
    }
  };

  vm.save = function() {
    vm.entity.tags = [];
    for(var cpt = 0; cpt < vm.tags.length; cpt++) {
      vm.entity.tags.push(vm.tags[cpt].text);
    }

    entityService.save(vm.projectId, vm.entity)
      .then(function(request) {
        vm.entityId = request.data.id;
        vm.entity = request.data;
        vm.alerts.push({msg: 'Entity saved.', type: 'info'});
      })
      .catch(function(error) {
        if(vm.entityId) {
          vm.alerts.push({msg: 'Unable to save entity ' + vm.entityId + '.', type: 'danger'});
        }
        else {
          vm.alerts.push({msg: 'Unable to save new entity.', type: 'danger'});
        }
        throw error;
      });
  };

  function activate() {
    vm.refresh();
  }

  activate();
}

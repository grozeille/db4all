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
    tags: [],
    fields: []
  };
  vm.tags = [];

  vm.currentField = null;
  vm.currentFieldIndex = -1;

  vm.edition = false;

  function toTextType(type) {
    if(type === 'TEXT') {
      return 'Text';
    }
    else if(type === 'NUMERIC') {
      return 'Numérique';
    }
    else if(type === 'DATE') {
      return 'Date';
    }
    else if(type === 'LINK') {
      return 'Lien Table';
    }
    else if(type === 'LINK_MULTIPLE') {
      return 'Line Table Multiple';
    }
  }

  vm.refresh = function() {
    if(vm.entityId !== '') {
      entityService.getById(vm.projectId, vm.entityId)
        .then(function(data) {
          vm.entity = data;
          vm.tags = [];
          for(var cpt = 0; cpt < vm.entity.tags.length; cpt++) {
            vm.tags.push({text: vm.entity.tags[cpt]});
          }
          if(angular.isUndefined(vm.entity.fields) || vm.entity.fields === null) {
            vm.entity.fields = [];
          }
          for(var cptField = 0; cptField < vm.entity.fields; cptField++) {
            vm.entity.fields[cptField].typeString = toTextType(vm.entity.fields[cptField].type);
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

  function resetField() {
    vm.currentFieldIndex = -1;
    vm.currentField = {
      name: '',
      type: 'TEXT'
    };
  }

  vm.addNewField = function() {
    resetField();
    vm.edition = true;
  };

  vm.saveField = function() {
    vm.currentField.typeString = toTextType(vm.currentField.type);
    if(vm.currentFieldIndex === -1) {
      vm.entity.fields.unshift(vm.currentField);
    }
    else {
      vm.entity.fields[vm.currentFieldIndex] = vm.currentField;
    }

    resetField();
    vm.edition = false;
  };

  vm.cancelField = function() {
    resetField();
    vm.edition = false;
  };

  vm.editField = function(index) {
    vm.currentFieldIndex = index;
    vm.currentField = angular.copy(vm.entity.fields[index]);
    vm.edition = true;
  };

  vm.removeField = function(index) {
  };

  function activate() {
    vm.refresh();
  }

  activate();
}

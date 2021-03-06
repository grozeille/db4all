require('./entityDetail.css');

module.exports = {
  controller: EntityDetailController,
  controllerAs: 'entityDetail',
  template: require('./entityDetail.html')
};

/** @ngInject */
function EntityDetailController($log, $uibModal, $state, $stateParams, $transitions, $scope, entityService, projectService) {
  var vm = this;

  vm.saving = false;
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
  vm.project = {
    name: ''
  };
  vm.dirty = false;
  vm.form = {};

  vm.currentField = null;
  vm.currentLinkEntity = null;
  vm.currentLinkField = null;
  vm.currentFieldIndex = -1;
  vm.newField = {
    fieldId: 0,
    name: '',
    type: 'TEXT',
    format: '0.00',
    maxLength: 0
  };
  vm.newLinkEntity = null;
  vm.newLinkField = null;

  vm.allEntities = [];

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
    else if(type === 'BOOL') {
      return 'Vrai/Faux';
    }
    else if(type === 'LINK') {
      return 'Lien Table';
    }
    else if(type === 'LINK_MULTIPLE') {
      return 'Line Table Multiple';
    }
  }

  function refreshFields() {
    if(angular.isUndefined(vm.entity.fields) || vm.entity.fields === null) {
      vm.entity.fields = [];
    }
    for(var cptField in vm.entity.fields) {
      vm.entity.fields[cptField].typeString = toTextType(vm.entity.fields[cptField].type);
    }
  }

  vm.refreshEntities = function(filter) {
    return entityService.getAllEntities(vm.projectId, filter, 0, 20)
    .then(function(data) {
      vm.allEntities = data.content;
    });
  };

  vm.refresh = function() {
    projectService.getById(vm.projectId)
      .then(function(data) {
        vm.project = data;
      })
      .catch(function(error) {
        vm.alerts.push({msg: 'Unable to get project ' + vm.projectId + '.', type: 'danger'});
        throw error;
      });

    if(vm.entityId !== '') {
      entityService.getById(vm.projectId, vm.entityId)
        .then(function(data) {
          vm.entity = data;
          vm.tags = [];
          for(var cptTags in vm.entity.tags) {
            vm.tags.push({text: vm.entity.tags[cptTags]});
          }
          refreshFields();

          vm.refreshEntities('');

          vm.dirty = false;
        })
        .catch(function(error) {
          vm.alerts.push({msg: 'Unable to get entity ' + vm.entityId + '.', type: 'danger'});
          throw error;
        });
    }
  };

  vm.save = function() {
    vm.saving = true;
    vm.entity.tags = [];
    for(var cpt = 0; cpt < vm.tags.length; cpt++) {
      vm.entity.tags.push(vm.tags[cpt].text);
    }

    entityService.save(vm.projectId, vm.entity)
      .then(function(request) {
        vm.entityId = request.data.id;
        vm.entity = request.data;
        refreshFields();
        vm.alerts.push({msg: 'Entity saved.', type: 'info'});
        vm.saving = false;
        vm.dirty = false;
        vm.form.$setPristine();
      })
      .catch(function(error) {
        vm.saving = false;
        if(vm.entityId) {
          vm.alerts.push({msg: 'Unable to save entity ' + vm.entityId + '.', type: 'danger'});
        }
        else {
          vm.alerts.push({msg: 'Unable to save new entity.', type: 'danger'});
        }
        throw error;
      });
  };

  function resetNewField() {
    vm.currentFieldIndex = -1;
    vm.newField = {
      fieldId: 0,
      name: '',
      type: 'TEXT',
      format: '0.00',
      maxLength: 0
    };
    vm.newField.typeString = toTextType(vm.newField.type);
    vm.newLinkEntity = null;
    vm.newLinkField = null;
  }

  vm.addNewField = function() {
    vm.dirty = true;
    var maxFieldId = 0;
    for(var fieldCpt in vm.entity.fields) {
      var field = vm.entity.fields[fieldCpt];
      if(field.fieldId > maxFieldId) {
        maxFieldId = field.fieldId;
      }
    }

    vm.newField.fieldId = maxFieldId + 1;
    vm.newField.typeString = toTextType(vm.newField.type);
    vm.entity.fields.push(vm.newField);
    resetNewField();
  };

  vm.saveField = function() {
    vm.dirty = true;
    vm.currentField.typeString = toTextType(vm.currentField.type);
    vm.entity.fields[vm.currentFieldIndex] = vm.currentField;
    vm.currentFieldIndex = -1;

    vm.currentLinkEntity = null;
    vm.currentLinkField = null;
  };

  vm.cancelField = function() {
    vm.currentFieldIndex = -1;

    vm.currentLinkEntity = null;
    vm.currentLinkField = null;
  };

  vm.editField = function(index) {
    vm.currentField = angular.copy(vm.entity.fields[index]);
    vm.currentFieldIndex = index;

    if(vm.currentField.type === 'LINK' || vm.currentField.type === 'LINK_MULTIPLE') {
      entityService.getById(vm.projectId, vm.currentField.entityId).then(function(data) {
        vm.currentLinkEntity = data;
        for(var fieldCpt in vm.currentLinkEntity.fields) {
          var field = vm.currentLinkEntity.fields[fieldCpt];
          if(field.fieldId === vm.currentField.entityField) {
            vm.currentLinkField = field;
            break;
          }
        }
      });
    }
  };

  vm.removeField = function(index) {
    vm.entity.fields.splice(index, 1);
    vm.dirty = true;
  };

  vm.moveFieldUp = function(index) {
    if(index === 0) {
      return;
    }
    var field = vm.entity.fields[index];
    vm.removeField(index);
    vm.entity.fields.splice(index - 1, 0, field);
    vm.dirty = true;
  };

  vm.moveFieldDown = function(index) {
    if(index === vm.entity.fields.length - 1) {
      return;
    }
    var field = vm.entity.fields[index];
    vm.removeField(index);
    vm.entity.fields.splice(index + 1, 0, field);
    vm.dirty = true;
  };

  vm.viewEntity = function() {
    $state.go('entityData', {projectId: vm.projectId, id: vm.entityId});
  };

  function activate() {
    vm.refresh();

    vm.onEnterHook = $transitions.onEnter({}, function($transition$) {
      if(vm.dirty || (angular.isDefined(vm.form) && vm.form.$dirty)) {
        var modalInstance = $uibModal.open({
          templateUrl: 'quit.html',
          controllerAs: 'quit',
          controller: function($uibModalInstance, parent) {
            var vm = this;
            vm.ok = function() {
              parent.onEnterHook();
              parent.dirty = false;
              parent.form.$setPristine();
              $uibModalInstance.close();
            };
            vm.cancel = function() {
              $uibModalInstance.dismiss('cancel');
            };
          },
          resolve: {
            parent: function() {
              return vm;
            }
          }
        });
        // return $q.reject();
        return modalInstance.result;
      }
      else {
        vm.onEnterHook();
      }
    });
  }

  activate();
}

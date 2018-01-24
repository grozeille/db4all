require('./projectDetail.css');

module.exports = {
  controller: ProjectDetailController,
  controllerAs: 'projectDetail',
  template: require('./projectDetail.html')
};

/** @ngInject */
function ProjectDetailController($log, $uibModal, $stateParams, $transitions, projectService) {
  var vm = this;

  vm.alerts = [];

  vm.projectId = $stateParams.id;
  vm.project = {
    id: '',
    name: '',
    comment: '',
    tags: []
  };
  vm.tags = [];

  vm.refresh = function() {
    if(vm.projectId !== '') {
      projectService.getById(vm.projectId)
        .then(function(data) {
          vm.project = data;
          vm.tags = [];
          for(var cpt = 0; cpt < vm.project.tags.length; cpt++) {
            vm.tags.push({text: vm.project.tags[cpt]});
          }
        })
        .catch(function(error) {
          vm.alerts.push({msg: 'Unable to get project ' + vm.projectId + '.', type: 'danger'});
          throw error;
        });
    }
  };

  vm.save = function() {
    vm.project.tags = [];
    for(var cpt = 0; cpt < vm.tags.length; cpt++) {
      vm.project.tags.push(vm.tags[cpt].text);
    }

    projectService.save(vm.project)
      .then(function(request) {
        vm.projectId = request.data.id;
        vm.project = request.data;
        vm.alerts.push({msg: 'Project saved.', type: 'info'});
      })
      .catch(function(error) {
        if(vm.projectId) {
          vm.alerts.push({msg: 'Unable to save project ' + vm.projectId + '.', type: 'danger'});
        }
        else {
          vm.alerts.push({msg: 'Unable to save new project.', type: 'danger'});
        }
        throw error;
      });
  };

  function activate() {
    vm.refresh();

    vm.onEnterHook = $transitions.onEnter({}, function($transition$) {
      if(angular.isDefined(vm.form) && vm.form.$dirty) {
        var modalInstance = $uibModal.open({
          templateUrl: 'quit.html',
          controllerAs: 'quit',
          controller: function($uibModalInstance, parent) {
            var vm = this;
            vm.ok = function() {
              parent.onEnterHook();
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

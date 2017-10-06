require('./project.css');

module.exports = {
  controller: ProjectController,
  controllerAs: 'project',
  template: require('./project.html')
};

/** @ngInject */
function ProjectController($log, $uibModal, $stateParams, projectService) {
  var vm = this;

  vm.alerts = [];

  vm.projectId = $stateParams.id;
  vm.project = {
    name: '',
    hiveDatabase: '',
    hdfsWorkingDirectory: '',
    members: []
  };
  vm.newMember = '';

  vm.refresh = function() {
    projectService.getById(vm.projectId)
      .then(function(data) {
        vm.project = data;
      })
      .catch(function(error) {
        vm.alerts.push({msg: 'Unable to get project ' + vm.projectId + '.', type: 'danger'});
        throw error;
      });
  };

  vm.addMember = function() {
    for(var index = 0; index < vm.project.members.length; index++) {
      if(vm.project.members[index].login === vm.newMember) {
        return;
      }
    }
    vm.project.members.push({login: vm.newMember});
    vm.newMember = '';
  };

  vm.removeMember = function(login) {
    for(var index = 0; index < vm.project.members.length; index++) {
      if(vm.project.members[index].login === login) {
        vm.project.members.splice(index, 1);
        return;
      }
    }
  };

  vm.save = function() {
    projectService.save(vm.project)
      .then(function() {
        vm.alerts.push({msg: 'Project saved.', type: 'info'});
      })
      .catch(function(error) {
        vm.alerts.push({msg: 'Unable to save project ' + vm.projectId + '.', type: 'danger'});
        throw error;
      });
  };

  function activate() {
    vm.refresh();
  }

  activate();
}

require('./profile.css');

module.exports = {
  controller: ProfileController,
  controllerAs: 'profile',
  template: require('./profile.html')
};

/** @ngInject */
function ProfileController($log, userService, projectService) {
  var vm = this;

  vm.alerts = [];
  vm.currentProfile = {};
  vm.memberProjects = [];
  vm.selectedProject = null;

  vm.refreshProjectList = function() {
    userService.getMemberProjects().then(function(data) {
      vm.memberProjects = data;

      vm.refreshLastProject();
    })
    .catch(function(error) {
      vm.alerts.push({msg: 'Unable to load current profile.', type: 'danger'});
      throw error;
    });
  };

  vm.refreshLastProject = function() {
    userService.getCurrent().then(function(data) {
      vm.currentProfile = data;
      if(vm.currentProfile.lastProject !== null) {
        for(var index = 0; index < vm.memberProjects.length; index++) {
          if(vm.memberProjects[index].id === vm.currentProfile.lastProject) {
            vm.selectedProject = vm.memberProjects[index];
            return;
          }
        }
      }
    })
    .catch(function(error) {
      vm.alerts.push({msg: 'Unable to load current profile.', type: 'danger'});
      throw error;
    });
  };

  vm.refresh = function() {
    vm.refreshProjectList();
  };

  vm.save = function() {
    userService.updateLastProject(vm.selectedProject.id).then(function(data) {
      vm.alerts.push({msg: 'Profile saved.', type: 'info'});
    })
    .catch(function(error) {
      vm.alerts.push({msg: 'Unable to save profile.', type: 'danger'});
      throw error;
    });
  };

  function activate() {
    vm.refresh();
  }

  activate();
}

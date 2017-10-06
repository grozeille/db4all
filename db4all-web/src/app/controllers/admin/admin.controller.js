require('./admin.css');

module.exports = {
  controller: AdminController,
  controllerAs: 'admin',
  template: require('./admin.html')
};

/** @ngInject */
function AdminController($log, $uibModal, adminService, userService, projectService, dataSetService) {
  var vm = this;

  vm.alerts = [];

  vm.adminUsers = [];
  vm.newLogin = '';

  vm.projects = [];
  vm.newProject = {
    name: '',
    hiveDatabase: '',
    hdfsWorkingDirectory: ''
  };

  vm.dataset = {
    regex: '',
    cron: ''
  };

  vm.showPage = false;

  vm.refreshPage = function() {
    userService.isCurrentAdmin().then(function(isAdmin) {
      vm.showPage = isAdmin;

      if(isAdmin) {
        vm.refreshAdmins();
        vm.refreshProjects();
      }
    });
  };

  vm.refreshAdmins = function() {
    adminService.getAllAdmins()
      .then(function(data) {
        vm.adminUsers = data;
      })
      .catch(function(error) {
        vm.alerts.push({msg: 'Unable to get admins.', type: 'danger'});
        throw error;
      });
  };

  vm.removeAdmin = function(login) {
    $uibModal.open({
      templateUrl: 'deleteAdmin.html',
      controllerAs: 'delete',
      controller: function($uibModalInstance, login, parent) {
        var vm = this;
        vm.login = login;
        vm.ok = function() {
          adminService.remove(login)
            .catch(function(error) {
              parent.alerts.push({msg: 'Unable to remove admin.', type: 'danger'});
              throw error;
            })
            .then(function() {
              parent.refreshAdmins();
            });
          $uibModalInstance.close();
        };
        vm.cancel = function() {
          $uibModalInstance.dismiss('cancel');
        };
      },
      resolve: {
        login: function () {
          return login;
        },
        parent: function() {
          return vm;
        }
      }
    });
  };

  vm.addAdmin = function() {
    adminService.add(vm.newLogin)
      .catch(function(error) {
        vm.alerts.push({msg: 'Unable to add new admin.', type: 'danger'});
        throw error;
      })
      .then(function() {
        vm.newLogin = '';
        vm.refreshAdmins();
      });
  };

  vm.refreshProjects = function() {
    projectService.getAllProjects()
      .then(function(data) {
        vm.projects = data;
      })
      .catch(function(error) {
        vm.alerts.push({msg: 'Unable to get projects.', type: 'danger'});
        throw error;
      });
  };

  vm.removeProject = function(id) {
    var project = null;

    // find the project thanks to the id
    for(var index = 0; index < vm.projects.length; index++) {
      if(vm.projects[index].id === id) {
        project = vm.projects[index];
        break;
      }
    }

    if(project === null) {
      vm.alerts.push({msg: 'Unknown project', type: 'danger'});
      return;
    }

    $uibModal.open({
      templateUrl: 'deleteProject.html',
      controllerAs: 'delete',
      controller: function($uibModalInstance, project, parent) {
        var vm = this;
        vm.project = project;
        vm.ok = function() {
          projectService.remove(project.id)
            .catch(function(error) {
              parent.alerts.push({msg: 'Unable to remove project.', type: 'danger'});
              throw error;
            })
            .then(function() {
              parent.refreshProjects();
            });
          $uibModalInstance.close();
        };
        vm.cancel = function() {
          $uibModalInstance.dismiss('cancel');
        };
      },
      resolve: {
        project: function () {
          return project;
        },
        parent: function() {
          return vm;
        }
      }
    });
  };

  vm.addProject = function() {
    projectService.add(vm.newProject)
      .catch(function(error) {
        vm.alerts.push({msg: 'Unable to add new project.', type: 'danger'});
        throw error;
      })
      .then(function() {
        vm.newProject.name = '';
        vm.newProject.hiveDatabase = '';
        vm.newProject.hdfsWorkingDirectory = '';
        vm.refreshProjects();
      });
  };

  vm.refreshDataSet = function() {
    dataSetService.refresh()
      .catch(function(error) {
        vm.alerts.push({msg: 'Unable to refresh.', type: 'danger'});
        throw error;
      })
      .then(function() {
        vm.alerts.push({msg: 'Refresh started.', type: 'info'});
      });
  };

  function activate() {
    vm.refreshPage();
  }

  activate();
}

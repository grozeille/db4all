require('./project.css');

module.exports = {
  controller: ProjectController,
  controllerAs: 'project',
  template: require('./project.html')
};

/** @ngInject */
function ProjectController($timeout, $log, $location, $filter, $uibModal, $state, projectService) {
  var vm = this;

  vm.sourceFilter = '';
  vm.projectList = [];
  vm.pageResult = {
    totalElements: 0,
    totalPages: 0,
    last: true,
    first: true
  };
  vm.currentPage = 1;
  vm.itemsPerPage = 11;

  function getProject(id) {
    var result = null;
    for(var cpt = 0; cpt < vm.projectList.length; cpt++) {
      if(vm.projectList[cpt].id === id) {
        result = vm.projectList[cpt];
        break;
      }
    }
    return result;
  }

  vm.createNewProject = function() {
    $state.go('projectDetail', {id: ''});
  };

  vm.editProject = function(id) {
    $state.go('projectDetail', {id: id});
  };

  vm.deleteProject = function(id) {
    var project = getProject(id);

    $uibModal.open({
      templateUrl: 'delete.html',
      controllerAs: 'delete',
      controller: function($uibModalInstance, projectName, parent) {
        var vm = this;
        vm.projectName = projectName;
        vm.ok = function() {
          projectService.remove(id).then(function() {
            $uibModalInstance.close();
            parent.loadAllProjects();
          });
        };
        vm.cancel = function() {
          $uibModalInstance.dismiss('cancel');
        };
      },
      resolve: {
        projectName: function () {
          return project.name;
        },
        parent: function() {
          return vm;
        }
      }
    });
  };

  vm.viewProject = function(id) {
    $state.go('entity', {projectId: id});
  };

  vm.loadAllProjects = function() {
    projectService.getAllProjects(vm.sourceFilter, vm.currentPage - 1, vm.itemsPerPage).then(function(data) {
      vm.projectList = data.content;
      vm.pageResult = {
        totalElements: data.totalElements,
        last: data.last,
        first: data.first,
        totalPages: data.totalPages
      };
      for(var cpt = 0; cpt < vm.projectList.length; cpt++) {
        vm.projectList[cpt].editLoading = false;
        vm.projectList[cpt].viewLoading = false;
      }
    });
  };

  function activate() {
    vm.loadAllProjects();
  }

  activate();
}

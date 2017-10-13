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

  vm.createNewProject = function() {
  };

  vm.loadAllProjects = function() {
    projectService.getAllProject(vm.sourceFilter, vm.currentPage - 1, vm.itemsPerPage).then(function(data) {
      vm.projectList = data.content;
      vm.pageResult = {
        totalElements: data.totalElements,
        last: data.last,
        first: data.first,
        totalPages: data.totalPages
      };
    });
  };

  function activate() {
    vm.loadAllProjects();
  }

  activate();
}

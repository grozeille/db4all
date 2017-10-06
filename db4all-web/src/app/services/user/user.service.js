module.exports = userService;

/** @ngInject */
function userService($log, $http, $location, $filter, $q, $rootScope, projectService) {
  var vm = this;
  vm.apiHost = $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/api';

  vm.getServiceData = function(response) {
    return response.data;
  };

  vm.catchServiceException = function(error) {
    $log.error('XHR Failed.\n' + angular.toJson(error.data, true));
    throw error;
  };

  function getCurrent() {
    var url = vm.apiHost + '/user/current';

    return $http.get(url).then(vm.getServiceData).catch(vm.catchServiceException);
  }

  function getMemberProjects() {
    var url = vm.apiHost + '/user/current/project';

    return $http.get(url).then(vm.getServiceData).catch(vm.catchServiceException);
  }

  function updateLastProject(projectId) {
    var url = vm.apiHost + '/user/current/last-project';

    var request = {
      projectId: projectId
    };

    return $http.post(url, request).then(vm.getServiceData).catch(vm.catchServiceException);
  }

  function getLastProject() {
    return getCurrent()
    .then(function(data) {
      return projectService.getById(data.lastProject);
    })
    .catch(vm.catchServiceException);
  }

  function isCurrentAdmin() {
    var url = vm.apiHost + '/user/current/is-admin';

    return $http.get(url).then(vm.getServiceData).catch(vm.catchServiceException);
  }

  var service = {
    getCurrent: getCurrent,
    isCurrentAdmin: isCurrentAdmin,
    getMemberProjects: getMemberProjects,
    updateLastProject: updateLastProject,
    getLastProject: getLastProject
  };

  return service;
}

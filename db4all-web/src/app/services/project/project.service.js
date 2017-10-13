module.exports = projectService;

/** @ngInject */
function projectService($log, $http, $location, $filter, $q, $rootScope) {
  var vm = this;
  vm.apiHost = $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/api';

  vm.getServiceData = function(response) {
    return response.data;
  };

  vm.catchServiceException = function(error) {
    $log.error('XHR Failed.\n' + angular.toJson(error.data, true));
    throw error;
  };

  function getAllProjects(filter, page, size) {
    var url = vm.apiHost + '/project?filter=' + filter + '&page=' + page + '&size=' + size;

    return $http.get(url).then(vm.getServiceData).catch(vm.catchServiceException);
  }

  function getById(id) {
    var url = vm.apiHost + '/project/' + id;

    return $http.get(url).then(vm.getServiceData).catch(vm.catchServiceException);
  }

  function save(project) {
    var url = vm.apiHost + '/project/' + project.id;

    return $http.put(url, project).catch(vm.catchServiceException);
  }

  function remove(id) {
    var url = vm.apiHost + '/project/' + id;

    return $http.delete(url).catch(vm.catchServiceException);
  }

  function add(project) {
    var url = vm.apiHost + '/project';

    return $http.post(url, project).catch(vm.catchServiceException);
  }

  var service = {
    getAllProjects: getAllProjects,
    getById: getById,
    add: add,
    remove: remove,
    save: save
  };

  return service;
}

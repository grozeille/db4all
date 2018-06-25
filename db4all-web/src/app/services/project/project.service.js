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
    if(project.id) {
      var putUrl = vm.apiHost + '/project/' + project.id;

      return $http
        .put(putUrl, project)
        .then(function(request) {
          return $http.get(putUrl);
        })
        .catch(vm.catchServiceException);
    }
    else {
      var postUrl = vm.apiHost + '/project';

      // create the initial project, then save all fields, then get the result
      return $http
        .post(postUrl, project)
        .then(function(request) {
          var location = request.headers().location;
          return $http
            .put(location, project)
            .then(function(request) {
              return $http.get(location);
            });
        })
        .catch(vm.catchServiceException);
    }
  }

  function remove(id) {
    var url = vm.apiHost + '/project/' + id;

    return $http.delete(url).catch(vm.catchServiceException);
  }

  var service = {
    getAllProjects: getAllProjects,
    getById: getById,
    remove: remove,
    save: save
  };

  return service;
}

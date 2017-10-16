module.exports = entityService;

/** @ngInject */
function entityService($log, $http, $location, $filter, $q, $rootScope) {
  var vm = this;
  vm.apiHost = $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/api';

  vm.getServiceData = function(response) {
    return response.data;
  };

  vm.catchServiceException = function(error) {
    $log.error('XHR Failed.\n' + angular.toJson(error.data, true));
    throw error;
  };

  function getAllEntities(projectId, filter, page, size) {
    var url = vm.apiHost + '/project/' + projectId + '/entity?filter=' + filter + '&page=' + page + '&size=' + size;

    return $http.get(url).then(vm.getServiceData).catch(vm.catchServiceException);
  }

  function getById(projectId, id) {
    var url = vm.apiHost + '/project/' + projectId + '/entity/' + id;

    return $http.get(url).then(vm.getServiceData).catch(vm.catchServiceException);
  }

  function save(projectId, entity) {
    if(entity.id) {
      var putUrl = vm.apiHost + '/project/' + projectId + '/entity/' + entity.id;

      return $http.put(putUrl, entity).catch(vm.catchServiceException);
    }
    else {
      var postUrl = vm.apiHost + '/project/' + projectId + '/entity';

      return $http.post(postUrl, entity).catch(vm.catchServiceException);
    }
  }

  function remove(projectId, id) {
    var url = vm.apiHost + '/project/' + projectId + '/entity/' + id;

    return $http.delete(url).catch(vm.catchServiceException);
  }

  var service = {
    getAllEntities: getAllEntities,
    getById: getById,
    remove: remove,
    save: save
  };

  return service;
}

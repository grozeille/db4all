module.exports = dataSetService;

/** @ngInject */
function dataSetService($log, $http, $location, $filter, $q, $rootScope) {
  var vm = this;
  vm.apiHost = $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/api';

  vm.getServiceData = function(response) {
    return response.data;
  };

  vm.catchServiceException = function(error) {
    $log.error('XHR Failed.\n' + angular.toJson(error.data, true));
    throw error;
  };

  function getAllDataSet(filter, page, size) {
    return $http.get(vm.apiHost + '/dataset?filter=' + filter + '&page=' + page + '&size=' + size)
      .then(vm.getServiceData)
      .catch(vm.catchServiceException);
  }

  function getDataSet(database, table) {
    return $http.get(vm.apiHost + '/dataset/' + database + '/' + table)
      .catch(function(request) {
        if(request.status === 404) {
          request.data = null;
          return request;
        }
        else {
          throw request;
        }
      })
      .then(vm.getServiceData)
      .catch(vm.catchServiceException);
  }

  function deleteDataSet(database, table) {
    return $http.delete(vm.apiHost + '/dataset/' + database + '/' + table)
      .catch(vm.catchServiceException);
  }

  function refresh() {
    return $http.post(vm.apiHost + '/dataset/refresh')
      .catch(vm.catchServiceException);
  }

  var service = {
    getAllDataSet: getAllDataSet,
    getDataSet: getDataSet,
    deleteDataSet: deleteDataSet,
    refresh: refresh
  };

  return service;
}

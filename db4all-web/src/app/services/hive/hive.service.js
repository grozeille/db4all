module.exports = hiveService;

/** @ngInject */
function hiveService($log, $http, $location, $filter, $q) {
  var vm = this;
  vm.apiHost = $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/api';
  // vm.apiHost = 'http://localhost:8000/api';

  vm.getServiceData = function(response) {
    return response.data;
  };

  vm.catchServiceException = function(error) {
    $log.error('XHR Failed for getContributors.\n' + angular.toJson(error.data, true));
  };

  var service = {
    getData: getData,
    getTables: getTables,
    getTable: getTable
  };

  return service;

  function getTables() {
    return $http.get(vm.apiHost + '/hive/tables')
                .then(vm.getServiceData)
                .catch(vm.catchServiceException);
  }

  function getTable(database, table) {
    return $http.get(vm.apiHost + '/hive/tables/' + database + '/' + table)
                .then(vm.getServiceData)
                .catch(vm.catchServiceException);
  }

  function getData(dataSetConf, max) {
    var canceller = $q.defer();
    var cancel = function(reason) {
      canceller.resolve(reason);
    };
    var promise = $http.post(vm.apiHost + '/hive/data/dataset?max=' + max, dataSetConf, {timeout: canceller.promise})
                .then(vm.getServiceData)
                .catch(vm.catchServiceException);

    return {
      promise: promise,
      cancel: cancel
    };
  }
}

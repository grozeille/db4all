module.exports = handsonTableRegistryService;

/** @ngInject */
function handsonTableRegistryService($log) {
  var vm = this;
  vm.instances = {};

  function getInstance(id) {
    return vm.instances[id];
  }

  function registerInstance(id, instance) {
    vm.instances[id] = instance;
  }

  function removeInstance(id) {
    vm.instances[id] = undefined;
  }

  var service = {
    getInstance: getInstance,
    registerInstance: registerInstance,
    removeInstance: removeInstance
  };

  return service;
}

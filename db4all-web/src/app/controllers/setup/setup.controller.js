require('./setup.css');

module.exports = {
  controller: SetupController,
  controllerAs: 'setup',
  template: require('./setup.html')
};

/** @ngInject */
function SetupController($log, $state, adminService) {
  var vm = this;

  vm.adminToken = '';
  vm.alerts = [];

  vm.save = function() {
    adminService.setupFirstAdmin(vm.adminToken)
    .then(function() {
      $state.go('dataset');
    })
    .catch(function(error) {
      vm.alerts.push({msg: 'Unable to proceed. Check server\'s logs for more information.', type: 'danger'});
      throw error;
    });
  };

  function activate() {
  }

  activate();
}

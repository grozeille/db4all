var Handsontable = require('Handsontable');

module.exports = function() {
  return {
    restrict: 'E',
    controller: HandsonTableController,
    controllerAs: 'ctrl',
    scope: true,
    bindToController: {
      data: '=',
      settings: '=',
      hotId: '@'
    },
    compile: function($element, attributes) {
      return {
        pre: function($scope, $element, attributes, controller, transcludeFn) {
          // eslint-disable-next-line angular/document-service
          var container = document.createElement('div');
          if(angular.isDefined(controller.id)) {
            container.id = controller.id;
          }
          $element[0].appendChild(container);
          controller.handsontable = new Handsontable(container, controller.settings);
          if(angular.isDefined(controller.id)) {
            controller.handsonTableRegistryService.registerInstance(controller.id, controller.handsontable);
          }
        },
        post: function($scope, $element, attributes, controller, transcludeFn) {
          // $log.info('POST');
        }
      };
    }
  };
};

/** @ngInject */
function HandsonTableController($scope, $log, handsonTableRegistryService) {
  var vm = this;
  vm.data = [];
  vm.settings = {};
  vm.handsontable = {};
  vm.handsonTableRegistryService = handsonTableRegistryService;

  vm.refresh = function() {
    $log.info('Refresh Handsontable');
    vm.handsontable.loadData(vm.data);
    vm.handsontable.updateSettings(vm.settings);
    vm.handsontable.render();
  };

  $scope.$watch(function() {
    return vm.settings;
  }, vm.refresh);

  $scope.$watch(function() {
    return vm.data;
  }, vm.refresh, true);
}

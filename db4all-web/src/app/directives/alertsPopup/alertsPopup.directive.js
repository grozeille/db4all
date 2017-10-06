module.exports = alertsPopup;

/** @ngInject */
function alertsPopup($window, $log, $compile) {
  function compile(element, attrs) {
    var content;
    var directive;
    content = element.contents().remove();

    return function(scope, element, attrs) {
      scope.alerts = [];

      scope.closeAlert = function(index) {
        scope.alerts.splice(index, 1);
      };

      if(angular.isUndefined(directive)) {
        directive = $compile(content);
      }

      element.append(directive(scope, function($compile) {
        return $compile;
      }));
    };
  }

  var directive = {
    restrict: 'E',
    scope: {
      alerts: '='
    },
    template: require('./alertsPopup.html'),
    compile: compile
  };

  return directive;
}

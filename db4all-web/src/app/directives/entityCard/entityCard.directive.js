require('./entityCard.css');

module.exports = entityCard;

/** @ngInject */
function entityCard($compile) {
  function compile(element, attrs) {
    var content;
    var directive;
    // content = element.contents().remove();

    return function(scope, element, attrs) {
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
    transclude: true,
    scope: {
      item: '='
    },
    template: require('./entityCard.html'),
    compile: compile
  };

  return directive;
}

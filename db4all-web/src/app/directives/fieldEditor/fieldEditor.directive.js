require('./fieldEditor.css');

module.exports = fieldEditor;

/** @ngInject */
function fieldEditor($compile) {
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
      field: '='
    },
    template: require('./fieldEditor.html'),
    compile: compile
  };

  return directive;
}

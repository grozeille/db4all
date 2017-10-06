module.exports = navbar;

/** @ngInject */
function navbar($compile) {
  function compile(element, attrs) {
    var content;
    var directive;
    content = element.contents().remove();

    return function(scope, element, attrs) {
      scope.menu = {
        left: [{
          name: 'DataSets',
          state: 'dataset'
        }/* , {
          name: 'Cubes',
          state: ''
        } */],
        right: [{
          name: 'Admin',
          state: 'admin'
        }, {
          name: 'Profile',
          state: 'profile'
        }]
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
    template: require('./navbar.html'),
    compile: compile
  };

  return directive;
}

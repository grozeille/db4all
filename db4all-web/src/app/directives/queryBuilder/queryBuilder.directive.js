module.exports = queryBuilder;

/** @ngInject */
function queryBuilder($window, $log, $compile) {
  function compile(element, attrs) {
    var content;
    var directive;
    content = element.contents().remove();

    return function(scope, element, attrs) {
      scope.operators = [
        {name: 'ET'},
        {name: 'OU'}
      ];

      scope.conditions = [
        {name: '='},
        {name: '!='},
        {name: '<'},
        {name: '<='},
        {name: '>'},
        {name: '>='},
        {name: 'EST NULL', noArgs: true},
        {name: 'N\'EST PAS NULL', noArgs: true},
        {name: 'COMMENCE PAR'},
        {name: 'NE COMMENCE PAS PAR'},
        {name: 'CONTIENT'},
        {name: 'NE CONTIENT PAS'},
        {name: 'TERMINE PAR'},
        {name: 'NE TERMINE PAS PAR'},
        {name: 'DANS', help: 'utilisez une virgule comme séparateur'},
        {name: 'N\'EST PAS DANS', help: 'utilisez une virgule comme séparateur'}
      ];

      scope.addCondition = function() {
        if(!scope.group.rules) {
          scope.group.rules = [];
        }

        var first = scope.fields.length > 0 ? scope.fields[0] : '';
        scope.group.rules.push({
          condition: '=',
          field: first,
          data: ''
        });
      };

      scope.removeCondition = function(index) {
        scope.group.rules.splice(index, 1);
      };

      scope.addGroup = function() {
        if(!scope.group.rules) {
          scope.group.rules = [];
        }

        scope.group.rules.push({
          group: {
            operator: 'ET',
            rules: []
          }
        });
      };

      scope.removeGroup = function() {
        if('group' in scope.$parent) {
          scope.$parent.group.rules.splice(scope.$parent.$index, 1);
        }
      };

      scope.isArgVisible = function(toTest) {
        for(var c = 0; c < scope.conditions.length; c++) {
          var condition = scope.conditions[c];
          if(condition.name.localeCompare(toTest) === 0) {
            return condition.noArgs;
          }
        }

        return true;
      };

      scope.help = function(toTest) {
        for(var c = 0; c < scope.conditions.length; c++) {
          var condition = scope.conditions[c];
          if(condition.name.localeCompare(toTest) === 0) {
            return condition.help;
          }
        }

        return '';
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
      group: '=',
      fields: '=',
      removeVisible: '@'
    },
    template: require('./queryBuilderDirective.html'),
    compile: compile
  };

  return directive;
}

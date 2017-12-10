require('./queryBuilderFilter.css');

module.exports = function() {
  return {
    restrict: 'E',
    template: require('./queryBuilderFilter.html'),
    controller: QueryBuilderFilterController,
    controllerAs: 'ctrl',
    scope: true,
    bindToController: {
      data: '=',
      filteredData: '=',
      currentFilter: '=',
      fields: '=',
      allFilters: '=',
      onSave: '=',
      onDelete: '=',
      applyFilter: '@',
      canSave: '@'
    }
  };
};

/** @ngInject */
function QueryBuilderFilterController($scope, $log, $uibModal, filterFilter) {
  var vm = this;
  vm.currentFilter = {operator: 'ET', rules: []};
  vm.filterOpen = false;
  vm.applyFilter = false;
  vm.data = [];
  vm.filteredData = [];
  vm.selectedFilter = {};
  vm.canSave = true;

  vm.computedGroup = function() {
    var result = computed(vm.currentFilter);

    // remove the first & last ()
    result = result.substring(1, result.length - 1);
    return result;
  };

  function computed(group) {
    if(!group) {
      return '';
    }

    if(!group.rules) {
      return '';
    }

    var str = '(';

    for (var i = 0; i < group.rules.length; i++) {
      if(i > 0) {
        str += ' <strong>' + group.operator + '</strong> ';
      }

      if(group.rules[i].field === null) {
        continue;
      }

      if(group.rules[i].group) {
        str += computed(group.rules[i].group);
      } else {
        if(group.rules[i].condition.localeCompare('EST NULL') === 0 || group.rules[i].condition.localeCompare('N\'EST PAS NULL') === 0) {
          str += group.rules[i].field.name + ' ' + htmlEntities(group.rules[i].condition);
        } else if(group.rules[i].condition.localeCompare('CONTIENT') === 0 || group.rules[i].condition.localeCompare('NE CONTIENT PAS') === 0) {
          str += group.rules[i].field.name + ' ' + htmlEntities(group.rules[i].condition) + ' [' + group.rules[i].data + ']';
        } else {
          str += group.rules[i].field.name + ' ' + htmlEntities(group.rules[i].condition) + ' ' + group.rules[i].data;
        }
      }
    }

    return str + ')';
  }

  function htmlEntities(str) {
    return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function testRule(row, rule) {
    var condition = rule.condition;
    var field = rule.field.fieldId;
    var value = row[field];

    if(rule.field.type === 'BOOL') {
      if(value === true) {
        value = 'vrai';
      }
      else {
        value = 'faux';
      }
    }

    if(condition === '=') {
      return String(value).toUpperCase() === rule.data.toUpperCase();
    }
    else if(condition === '!=') {
      return String(value).toUpperCase() !== rule.data.toUpperCase();
    }
    else if(condition === '<') {
      return parseFloat(value) < parseFloat(rule.data);
    }
    else if(condition === '<=') {
      return parseFloat(value) <= parseFloat(rule.data);
    }
    else if(condition === '>') {
      return parseFloat(value) > parseFloat(rule.data);
    }
    else if(condition === '>=') {
      return parseFloat(value) >= parseFloat(rule.data);
    }
    else if(condition === 'EST NULL') {
      return (angular.isUndefined(value) || value === null || value.length <= 0);
    }
    else if(condition === 'N\'EST PAS NULL') {
      return !(angular.isUndefined(value) || value === null || value.length <= 0);
    }
    else if(condition === 'COMMENCE PAR') {
      return String(value).toUpperCase().startsWith(rule.data.toUpperCase());
    }
    else if(condition === 'NE COMMENCE PAS PAR') {
      return !String(value).startsWith(rule.data);
    }
    else if(condition === 'TERMINE PAR') {
      return String(value).toUpperCase().endsWith(rule.data.toUpperCase());
    }
    else if(condition === 'NE TERMINE PAS PAR') {
      return !String(value).toUpperCase().endsWith(rule.data.toUpperCase());
    }
    else if(condition === 'CONTIENT') {
      return String(value).toUpperCase().indexOf(rule.data.toUpperCase()) !== -1;
    }
    else if(condition === 'NE CONTIENT PAS') {
      return String(value).toUpperCase().indexOf(rule.data.toUpperCase()) === -1;
    }
    else if(condition === 'DANS') {
      var inTestValues = rule.data.split(',');
      var inMatch = false;
      for(var inCpt in inTestValues) {
        var inTestValue = inTestValues[inCpt];
        inMatch = inMatch || (inTestValue.toUpperCase() === value.toUpperCase());
      }
      return inMatch;
    }
    else if(condition === 'N\'EST PAS DANS') {
      var notIntTestValues = rule.data.split(',');
      var notInMatch = false;
      for(var notInCpt in notIntTestValues) {
        var notInTestValue = notIntTestValues[notInCpt];
        notInMatch = notInMatch || (notInTestValue.toUpperCase() === value.toUpperCase());
      }
      return !notInMatch;
    }

    return true;
  }

  function testRuleGroup(row, ruleGroup) {
    var operator = ruleGroup.operator;

    var applyAllRules = false;
    if(operator === 'ET') {
      applyAllRules = true;
    }
    else if(operator === 'OU') {
      applyAllRules = false;
    }

    for(var ruleCpt in ruleGroup.rules) {
      var rule = ruleGroup.rules[ruleCpt];
      var applyRule = false;

      if(angular.isDefined(rule.group)) {
        applyRule = testRuleGroup(row, rule.group);
      }
      else {
        applyRule = testRule(row, rule);
      }

      if(operator === 'ET') {
        applyAllRules = applyAllRules && applyRule;
        if(applyAllRules === false) {
          break;
        }
      }
      else if(operator === 'OU') {
        applyAllRules = applyAllRules || applyRule;
        if(applyAllRules === true) {
          break;
        }
      }
    }

    return applyAllRules;
  }

  vm.filter = function() {
    $log.info(vm.computedGroup());

    var inputArray = vm.data;
    var filteredArray = [];

    var operator = vm.currentFilter.operator;

    for(var arrayCpt in inputArray) {
      var row = inputArray[arrayCpt];
      var applyAllRules = testRuleGroup(row, vm.currentFilter);

      if(applyAllRules) {
        filteredArray.push(row);
      }
    }

    vm.filteredData = filteredArray;
  };

  vm.cancelFilter = function() {
    vm.filteredData = vm.data;
  };

  vm.load = function() {
    if(angular.isDefined(vm.selectedFilter.filter)) {
      vm.currentFilter = angular.copy(vm.selectedFilter.filter);
      vm.filter();
    }
  };

  vm.save = function() {
    if(angular.isDefined(vm.selectedFilter.name) && vm.selectedFilter.name.length > 0) {
      vm.selectedFilter.filter = angular.copy(vm.currentFilter);

      if(angular.isDefined(vm.onSave)) {
        vm.onSave(vm.selectedFilter);
        vm.selectedFilter.isNew = false;
      }
    }
  };

  vm.delete = function() {
    if(angular.isDefined(vm.selectedFilter.name) && vm.selectedFilter.name.length > 0) {
      if(angular.isDefined(vm.onDelete)) {
        $uibModal.open({
          templateUrl: 'delete.html',
          controllerAs: 'delete',
          controller: function($uibModalInstance, name, parent) {
            var vm = this;
            vm.name = name;
            vm.ok = function() {
              parent.selectedFilter = {};
              parent.onDelete(vm.name);
              $uibModalInstance.close();
            };
            vm.cancel = function() {
              $uibModalInstance.dismiss('cancel');
            };
          },
          resolve: {
            name: function () {
              return vm.selectedFilter.name;
            },
            parent: function() {
              return vm;
            }
          }
        });
      }
    }
  };

  vm.onSelectFilter = function(item, model) {
    vm.selectedFilter = model;
    $scope.$apply();
  };

  vm.refresh = function() {
    if(vm.applyFilter) {
      vm.filter();
    }
    else {
      vm.cancelFilter();
    }
  };

  vm.canDelete = function() {
    var canDeleteFilter =
      vm.selectedFilter !== null &&
      (angular.isDefined(vm.selectedFilter.name) && vm.selectedFilter.name.length > 0) &&
      (angular.isUndefined(vm.selectedFilter.isNew) || vm.selectedFilter.isNew === false);
    return canDeleteFilter;
  };

  $scope.$watch(vm.applyFilter, vm.refresh);

  $scope.$watch(vm.data, vm.refresh, true);

  $scope.$watch(vm.currentFilter, vm.refresh);
}

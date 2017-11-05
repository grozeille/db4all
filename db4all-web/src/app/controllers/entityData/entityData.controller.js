require('./entityData.css');

module.exports = {
  controller: EntityDataController,
  controllerAs: 'entityData',
  template: require('./entityData.html')
};

/** @ngInject */
function EntityDataController($log, $uibModal, $stateParams, entityService) {
  var vm = this;

  vm.alerts = [];

  vm.projectId = $stateParams.projectId;
  vm.entityId = $stateParams.id;
  vm.entity = {
    id: '',
    name: '',
    comment: '',
    tags: [],
    fields: []
  };
  vm.filteredData = [];
  vm.data = [];
  vm.settings = {
    manualColumnResize: true,
    contextMenu: ['row_above', 'row_below', 'remove_row']
  };

  vm.queryGroup = {operator: 'ET', rules: []};
  vm.filterOpen = false;

  vm.refresh = function() {
    entityService.getById(vm.projectId, vm.entityId)
      .then(function(entity) {
        vm.entity = entity;
        if(angular.isUndefined(vm.entity.fields) || vm.entity.fields === null) {
          vm.entity.fields = [];
        }
        return entityService.getData(vm.projectId, vm.entityId).then(function (data) {
          vm.data = data;
          vm.filteredData = vm.data;
        });
      })
      .catch(function(error) {
        vm.alerts.push({msg: 'Unable to get entity ' + vm.entityId + '.', type: 'danger'});
        throw error;
      });
  };

  vm.save = function() {
    entityService.saveData(vm.projectId, vm.entityId, vm.data)
    .then(function(request) {
      vm.alerts.push({msg: 'Entity saved.', type: 'info'});
    })
    .catch(function(error) {
      vm.alerts.push({msg: 'Unable to save entity ' + vm.entityId + '.', type: 'danger'});
      throw error;
    });
  };

  function testRule(row, rule) {
    var condition = rule.condition;
    var field = rule.field.name;
    var value = row[field];

    if(condition === '=') {
      return value === rule.data;
    }
    else if(condition === '!=') {
      return value !== rule.data;
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
      return String(value).startsWith(rule.data);
    }
    else if(condition === 'NE COMMENCE PAS PAR') {
      return !String(value).startsWith(rule.data);
    }
    else if(condition === 'TERMINE PAR') {
      return String(value).endsWith(rule.data);
    }
    else if(condition === 'NE TERMINE PAS PAR') {
      return !String(value).endsWith(rule.data);
    }
    else if(condition === 'CONTIENT') {
      return String(value).indexOf(rule.data) !== -1;
    }
    else if(condition === 'NE CONTIENT PAS') {
      return String(value).indexOf(rule.data) === -1;
    }
    else if(condition === 'DANS') {
      var inTestValues = rule.data.split(',');
      var inMatch = false;
      for(var inCpt in inTestValues) {
        var inTestValue = inTestValues[inCpt];
        inMatch = inMatch || (inTestValue === value);
      }
      return inMatch;
    }
    else if(condition === 'N\'EST PAS DANS') {
      var notIntTestValues = rule.data.split(',');
      var notInMatch = false;
      for(var notInCpt in notIntTestValues) {
        var notInTestValue = notIntTestValues[notInCpt];
        notInMatch = notInMatch || (notInTestValue === value);
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

    var operator = vm.queryGroup.operator;

    for(var arrayCpt in inputArray) {
      var row = inputArray[arrayCpt];
      var applyAllRules = testRuleGroup(row, vm.queryGroup);

      if(applyAllRules) {
        filteredArray.push(row);
      }
    }

    vm.filteredData = filteredArray;
  };

  vm.cancelFilter = function() {
    vm.filteredData = vm.data;
  };

  function htmlEntities(str) {
    return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

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

  vm.computedGroup = function() {
    var result = computed(vm.queryGroup);

    // remove the first & last ()
    result = result.substring(1, result.length - 1);
    return result;
  };

  function intersect(array1, array2) {
    var array3 = [];
    angular.forEach(array1, function(value, index) {
      angular.forEach(array2, function(object, index1) {
        if(value.name === object.name) {
          array3.push(object);
        }
      });
    });
  }

  function activate() {
    vm.refresh();
  }

  activate();
}

require('./entityData.css');

module.exports = {
  controller: EntityDataController,
  controllerAs: 'entityData',
  template: require('./entityData.html')
};

var Handsontable = require('Handsontable');

/** @ngInject */
function EntityDataController($scope, $log, $uibModal, $stateParams, $document, entityService, hotRegisterer) {
  var vm = this;

  vm.alerts = [];
  vm.saving = false;

  vm.projectId = $stateParams.projectId;
  vm.entityId = $stateParams.id;
  vm.entity = {
    id: '',
    name: '',
    comment: '',
    tags: [],
    fields: []
  };
  vm.fields = {};
  vm.filteredData = [];
  vm.data = [];
  vm.columns = [];
  vm.colWidths = [];
  vm.settings = {
    manualColumnResize: true,
    manualRowResize: false,
    columnSorting: true,
    allowInvalid: false,
    autoColumnSize: false,
    contextMenu: ['row_above', 'row_below', 'remove_row']
  };

  vm.linkEditor = {};
  vm.currentColumn = '';

  vm.queryGroup = {operator: 'ET', rules: []};
  vm.filterOpen = false;

  vm.refresh = function() {
    entityService.getById(vm.projectId, vm.entityId)
      .then(function(entity) {
        vm.entity = entity;
        if(angular.isUndefined(vm.entity.fields) || vm.entity.fields === null) {
          vm.entity.fields = [];
        }

        vm.colWidths = [];
        vm.columns = [];
        for(var cptField in vm.entity.fields) {
          var field = vm.entity.fields[cptField];

          var fieldWidth = 100;
          if(angular.isDefined(field.width) && field.width !== 0) {
            fieldWidth = field.width;
          }
          vm.colWidths.push(fieldWidth);

          vm.fields[field.fieldId] = field;

          var column = {
            title: field.name,
            data: String(field.fieldId),
            readOnly: false
          };

          // TEXT,NUMERIC,DATE,BOOL,LINK,LINK_MULTIPLE
          if(field.type === 'TEXT') {
            column.editor = 'text';
            column.renderer = 'text';
          }
          else if(field.type === 'NUMERIC') {
            column.editor = 'numeric';
            column.format = '0.00';
            column.renderer = 'numeric';
          }
          else if(field.type === 'DATE') {
            // column.editor = Handsontable.editors.DateEditor;
            column.editor = 'date';
            // column.renderer = 'date';
            column.renderer = Handsontable.renderers.DateRenderer;
          }
          else if(field.type === 'BOOL') {
            column.editor = 'checkbox';
            column.renderer = 'checkbox';
          }
          else if(field.type === 'LINK') {
            column.editor = vm.linkEditor;
            column.renderer = vm.linkRenderer;
          }
          else if(field.type === 'LINK_MULTIPLE') {
            column.editor = vm.linkEditor;
            column.renderer = vm.linkRenderer;
          }
          vm.columns.push(column);
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
    vm.saving = true;

    var handsontable = hotRegisterer.getInstance('entity-handsontable');
    for(var cptField in vm.entity.fields) {
      var field = vm.entity.fields[cptField];
      field.width = handsontable.getColWidth(cptField);
    }

    // save the entity settings to keep the column width, then save the data
    entityService.save(vm.projectId, vm.entity)
    .then(function() {
      return entityService.saveData(vm.projectId, vm.entityId, vm.data);
    })
    .then(function(request) {
      vm.alerts.push({msg: 'Entity saved.', type: 'info'});
      vm.saving = false;
    })
    .catch(function(error) {
      vm.saving = false;
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

  vm.linkRenderer = function(hotInstance, td, row, column, prop, value, cellProperties) {
    // Optionally include `BaseRenderer` which is responsible for adding/removing CSS classes to/from the table cells.
    Handsontable.renderers.BaseRenderer.apply(this, arguments);

    if(angular.isDefined(value) && value !== null && value instanceof Array) {
      td.innerHTML = value.join(', ');
    }

    return td;
  };

  vm.onAfterSelection = function(row, column) {
    var field = vm.fields[this.getCellMeta(row, column).prop];
    if(field.type === 'BOOL') {
      if(this.getDataAtCell(row, column)) {
        vm.currentColumn = 'VRAI';
      }
      else {
        vm.currentColumn = 'FAUX';
      }
    }
    else if(field.type === 'LINK' || field.type === 'LINK_MULTIPLE') {
      vm.currentColumn = this.getDataAtCell(row, column).join(', ');
    }
    else {
      vm.currentColumn = this.getDataAtCell(row, column);
    }
    $scope.$apply();
  };

  function activate() {
    vm.linkEditor = Handsontable.editors.BaseEditor.prototype.extend();

    vm.linkEditor.prototype.init = function () {
      this.linksModal = require('./links/links.controller');
      this.linksModal.size = 'lg';
      this.linksModal.resolve = {};
    };

    vm.linkEditor.prototype.getValue = function() {
      return this.value;
    };

    vm.linkEditor.prototype.setValue = function(value) {
      this.value = value;

      if(value === '' || angular.isUndefined(value)) {
        value = [];
      }

      var field = vm.fields[this.prop];
      var linkProjectId = field.projectId;
      var linkEntityId = field.entityId;

      this.linksModal.resolve.entityService = function () {
        return entityService;
      };
      this.linksModal.resolve.projectId = function () {
        return linkProjectId;
      };
      this.linksModal.resolve.entityId = function () {
        return linkEntityId;
      };
      this.linksModal.resolve.links = function () {
        return value;
      };
    };

    vm.linkEditor.prototype.prepare = function() {
      Handsontable.editors.BaseEditor.prototype.prepare.apply(this, arguments);
      // Handsontable.dom.empty(this.button);
    };

    vm.linkEditor.prototype.open = function() {
      this.linksModalInstance = $uibModal.open(this.linksModal);
      var dataToUpdate = vm.filteredData[this.row];
      var dataProp = this.prop;

      // update the cell when closing the modal
      this.linksModalInstance.result.then(function(data) {
        dataToUpdate[dataProp] = data;
      });
    };

    vm.linkEditor.prototype.close = function() {
    };

    vm.linkEditor.prototype.focus = function() {
    };

    vm.refresh();
  }

  activate();
}

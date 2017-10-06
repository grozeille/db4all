require('./wranglingDataSet.css');

module.exports = {
  controller: WranglingDataSetController,
  controllerAs: 'wranglingDataSet',
  template: require('./wranglingDataSet.html')
};

/** @ngInject */
function WranglingDataSetController($timeout, $log, $uibModal, $state, $stateParams, $scope, $rootScope, $window, wranglingDataSetService) {
  var vm = this;
  vm.alerts = [];

  vm.maxRows = 10000;
  vm.selectedColumn = null;
  vm.selectedDatabase = null;
  vm.selectedTable = null;
  vm.selectedColumnIsCalculated = null;

  vm.database = '';
  vm.name = '';
  vm.comment = '';

  vm.renameField = null;
  vm.renameDescription = null;
  vm.changeType = null;

  vm.isLoading = false;
  vm.activeTab = 0;

  vm.tables = [];
  vm.calculatedColumns = [];
  vm.isColumnLinked = { };

  vm.queryFields = [];

  vm.saving = false;

  vm.needRefresh = false;

  vm.tags = [];

  vm.aceOption = {
    mode: 'ace/mode/sql',
    theme: 'ace/theme/tomorrow'
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
        if(group.rules[i].condition.localeCompare('IS NULL') === 0 || group.rules[i].condition.localeCompare('IS NOT NULL') === 0) {
          str += group.rules[i].field.name + ' ' + htmlEntities(group.rules[i].condition);
        } else if(group.rules[i].condition.localeCompare('IN') === 0 || group.rules[i].condition.localeCompare('NOT IN') === 0) {
          str += group.rules[i].field.name + ' ' + htmlEntities(group.rules[i].condition) + ' [' + group.rules[i].data + ']';
        } else {
          str += group.rules[i].field.name + ' ' + htmlEntities(group.rules[i].condition) + ' ' + group.rules[i].data;
        }
      }
    }

    return str + ')';
  }

  vm.computedGroup = function() {
    return '<b>Filter:</b> ' + computed(vm.queryGroup);
  };

  function internalSave(temporary) {
    vm.refreshTables();

    if(angular.isUndefined(temporary)) {
      temporary = false;
    }

    if(!temporary) {
      vm.saving = true;
    }

    var tags = [];
    for(var cpt = 0; cpt < vm.tags.length; cpt++) {
      tags.push(vm.tags[cpt].text);
    }

    var dataSet = {
      comment: vm.comment,
      tags: tags
    };

    wranglingDataSetService.setDataSet(dataSet);
    wranglingDataSetService.setFilter(vm.queryGroup);

    return wranglingDataSetService.saveDataSet(temporary);
  }

  vm.save = function(temporary) {
    return internalSave(temporary)
      .then(function() {
        $log.info('DataSet saved...');
        vm.saving = false;
        vm.alerts.push({msg: 'DataSet saved.', type: 'info'});
      })
      .catch(function(error) {
        $log.info('Error...');
        vm.saving = false;
        vm.alerts.push({msg: 'Unable to save the DataSet.', type: 'danger'});
        $log.error(error);
        throw error;
      });
  };

  vm.refreshTables = function() {
    vm.selectedColumn = null;
    vm.selectedDatabase = null;
    vm.selectedTable = null;
    vm.selectedColumnIsCalculated = null;
    vm.queryFields = [];

    vm.tables = wranglingDataSetService.getTables();
    vm.calculatedColumns = wranglingDataSetService.getCalculatedColumns();
    var links = wranglingDataSetService.getLinks();
    vm.isColumnLinked = { };
    for(var l = 0; l < links.length; l++) {
      var link = links[l];
      vm.isColumnLinked[link.left.database + '.' + link.left.table + '.' + link.left.column] = true;
      // vm.isColumnLinked[link.right.database+'.'+link.right.table+'.'+link.right.column] = true;
    }

    var columnDefs = [];

    for(var t = 0; t < vm.tables.length; t++) {
      var table = vm.tables[t];
      table.columnFilter = '';

      for(var c = 0; c < table.columns.length; c++) {
        var column = table.columns[c];

        vm.queryFields.push({
          name: table.database + '.' + table.table + '.' + column.newName,
          groupName: table.database + '.' + table.table,
          database: table.database,
          table: table.table,
          column: column.name
        });

        if(column.selected) {
          columnDefs.push({
            field: column.newName.toLowerCase(),
            enableHiding: false,
            minWidth: 70,
            width: 100,
            headerCellTemplate: require('./header-cell-template.html'),
            hive: {
              database: table.database,
              table: table.table,
              column: column
            }
          });
        }
      }

      vm.needRefresh = false;
    }

    for(var cc = 0; cc < vm.calculatedColumns.length; cc++) {
      var calculatedColumn = vm.calculatedColumns[cc];

      columnDefs.push({
        field: calculatedColumn.newName.toLowerCase(),
        enableHiding: false,
        minWidth: 70,
        width: 100,
        enableColumnResizing: true,
        headerCellTemplate: require('./header-cell-template.html'),
        hive: {
          database: '',
          table: '',
          column: calculatedColumn
        }
      });
    }

    vm.gridOptions = {
      enableSorting: false,
      enableColumnMenus: false,
      enableColumnResizing: true,
      appScopeProvider: vm,
      columnDefs: columnDefs,
      data: [],
      onRegisterApi: function(gridApi) {
        vm.gridSampleApi = gridApi;
      }
    };
  };

  var linksModal = require('./links/links.controller');

  vm.links = function(table) {
    linksModal.size = 'lg';
    linksModal.resolve = {
      database: function () {
        return table.database;
      },
      table: function() {
        return table.table;
      }
    };
    $uibModal.open(linksModal);
  };

  var deleteTableModal = require('./deleteTable/deleteTable.controller');

  vm.removeTable = function(table) {
    deleteTableModal.resolve = {
      database: function () {
        return table.database;
      },
      table: function() {
        return table.table;
      }
    };

    $uibModal.open(deleteTableModal);
  };

  vm.getData = function() {
    vm.refreshTables();

    vm.isLoading = true;
    return internalSave(true).then(function() {
      return wranglingDataSetService.getData(vm.maxRows);
    })
    .then(function(response) {
      if(response.data !== null) {
        vm.gridOptions.data = response.data.data;
      }
      vm.isLoading = false;
    })
    .catch(function(error) {
      $log.error(error);
      vm.isLoading = false;
    });
  };

  vm.cancelGetData = function() {
    wranglingDataSetService.cancelGetData('user cancel');
  };

  vm.rename = function() {
    if(angular.isDefined(vm.selectedColumn)) {
      vm.selectedColumn.newName = vm.renameField;
      vm.selectedColumn.newDescription = vm.renameDescription;
      vm.selectedColumn.newType = vm.changeType;

      vm.needRefresh = true;
    }
  };

  vm.makeTablePrimary = function(database, table) {
    wranglingDataSetService.makeTablePrimary(database, table);
  };

  vm.isColumnSelected = function(col) {
    return vm.selectedColumn === col.colDef.hive.column &&
      vm.selectedDatabase === col.colDef.hive.database &&
      vm.selectedTable === col.colDef.hive.table;
  };

  vm.selectColumn = function(col) {
    // if it's the same, unselect it
    if(angular.isDefined(vm.selectedColumn) && vm.selectedColumn !== null &&
        col.colDef.hive.column.name.localeCompare(vm.selectedColumn.name) === 0 &&
        col.colDef.hive.database.localeCompare(vm.selectedDatabase) === 0 &&
        col.colDef.hive.table.localeCompare(vm.selectedTable) === 0) {
      vm.unSelectColumn();
      return;
    }

    vm.selectedColumn = col.colDef.hive.column;
    vm.selectedDatabase = col.colDef.hive.database;
    vm.selectedTable = col.colDef.hive.table;
    vm.selectedColumnIsCalculated = col.colDef.hive.column.calculated;

    if(angular.isDefined(vm.selectedColumn) && vm.selectedColumn !== null) {
      vm.renameField = vm.selectedColumn.newName;
      vm.renameDescription = vm.selectedColumn.newDescription;
      vm.changeType = vm.selectedColumn.newType;
    }

    if(vm.selectedColumnIsCalculated) {
      vm.activeTab = 3;
    } else {
      vm.activeTab = 2;
    }
  };

  vm.unSelectColumn = function() {
    vm.selectedColumn = null;
    vm.selectedDatabase = null;
    vm.selectedTable = null;
    vm.selectedColumnIsCalculated = null;

    vm.activeTab = 0;
  };

  vm.onColumnSelectionChange = function() {
    wranglingDataSetService.notifyOnChange();
  };

  vm.createCalculated = function() {
    if(angular.isDefined(vm.selectedColumn) && vm.selectedColumn !== null) {
      var calculatedColumn = {
        name: 'calculated_' + wranglingDataSetService.getNextCalculatedColumnSequence(),
        newName: vm.selectedColumn.newName + ' calculated',
        newDescription: '',
        formula: '`' + vm.selectedColumn.newName + '`',
        calculated: true
      };
      wranglingDataSetService.addCalculatedColumn(calculatedColumn);

      // TODO select the new column
      // vm.gridOptions.columnDefs
      // vm.selectColumn
    }
  };

  var deleteCalculatedModal = require('./deleteCalculated/deleteCalculated.controller');

  vm.removeCalculatedColumn = function($event, column) {
    $event.preventDefault();

    deleteCalculatedModal.resolve = {
      columnName: function() {
        return column.name;
      }
    };
    $uibModal.open(deleteCalculatedModal);
  };

  function activate() {
    wranglingDataSetService.subscribeOnChange($scope, function() {
      vm.refreshTables();
      $log.info('Refreshed after changes at: ' + new Date());
    });

    var dataSet = wranglingDataSetService.getDataSet();

    vm.database = dataSet.database;
    vm.name = dataSet.name;
    vm.comment = dataSet.comment;

    vm.tags = [];
    for(var cpt = 0; cpt < dataSet.tags.length; cpt++) {
      vm.tags.push({text: dataSet.tags[cpt]});
    }

    vm.queryGroup = wranglingDataSetService.getFilter();

    vm.refreshTables();
  }

  activate();
}

module.exports = wranglingDataSetService;

/** @ngInject */
function wranglingDataSetService($log, $http, $location, $filter, $q, $rootScope, dataSetService, userService) {
  var vm = this;
  vm.apiHost = $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/api';

  vm.database = '';
  vm.table = '';
  vm.temporaryTable = '';
  vm.dataSetRequest = {
    comment: '',
    tags: []
  };
  vm.wranglingDataSetConfig = {
    tables: [],
    calculatedColumns: [],
    links: []
  };
  vm.currentUser = null;

  vm.tables = [];
  vm.filter = {operator: 'AND', rules: []};

  vm.cancelCurrentGetData = null;

  vm.getServiceData = function(response) {
    return response.data;
  };

  vm.catchServiceException = function(error) {
    $log.error('XHR Failed.\n' + angular.toJson(error.data, true));
    throw error;
  };

  function initDataSet(database, table) {
    vm.database = database;
    vm.table = table;
    vm.dataSetRequest = null;
    vm.wranglingDataSetConfig = null;

    return userService.getCurrent().then(function(data) {
      vm.currentUser = data;
      vm.temporaryTable = '_tmp_' + vm.currentUser.login + '_' + vm.table;
    })
    .then(function() {
      return dataSetService.getDataSet(vm.database, vm.table);
    })
    .then(function(data) {
      if(data === null) {
        // this table doesn't exist yet, create it first in "temporary" mode
        vm.dataSetRequest = {
          comment: '',
          tags: []
        };
        vm.wranglingDataSetConfig = {
          tables: [],
          calculatedColumns: [],
          links: []
        };
        vm.filter = {operator: 'AND', rules: []};
        vm.tables = [];

        return saveDataSet(true);
      }
      else {
        // the table already exists, clone it as temporary table
        var url = vm.apiHost + '/dataset/wrangling/' + vm.database + '/' + vm.table + '/clone';

        var cloneRequest = {
          targetDatabase: vm.database,
          targetTable: vm.temporaryTable,
          temporary: true
        };

        return $http.post(url, cloneRequest)
          .then(function() {
            return dataSetService.getDataSet(vm.database, vm.temporaryTable);
          })
          .then(function(tmpData) {
            vm.dataSetRequest = {
              comment: tmpData.comment,
              tags: tmpData.tags
            };
            vm.wranglingDataSetConfig = angular.fromJson(tmpData.dataSetConfiguration);
            vm.filter = parseDataSetFilterGroup(vm.wranglingDataSetConfig.filter);
            vm.tables = [];
            for(var t = 0; t < vm.wranglingDataSetConfig.tables.length; t++) {
              loadTable(vm.wranglingDataSetConfig.tables[t]);
            }
          });
      }
    })
    .then(function() {
      notifyOnChange();
    })
    .catch(vm.catchServiceException);
  }

  function cloneDataSet(sourceDatabase, sourceTable, targetDatabase, targetTable) {
    vm.database = targetDatabase;
    vm.table = targetTable;
    vm.dataSetRequest = null;
    vm.customFileDataSetConfig = null;

    return userService.getCurrent().then(function(data) {
      vm.currentUser = data;
      vm.temporaryTable = '_tmp_' + vm.currentUser.login + '_' + vm.table;
    })
    .then(function() {
      // clone the source table as the temporary table
      var url = vm.apiHost + '/dataset/wrangling/' + sourceDatabase + '/' + sourceTable + '/clone';

      var cloneRequest = {
        targetDatabase: vm.database,
        targetTable: vm.temporaryTable,
        temporary: true
      };

      return $http.post(url, cloneRequest)
        .then(function() {
          return dataSetService.getDataSet(vm.database, vm.temporaryTable);
        })
        .then(function(tmpData) {
          vm.dataSetRequest = {
            comment: tmpData.comment,
            tags: tmpData.tags
          };
          vm.wranglingDataSetConfig = angular.fromJson(tmpData.dataSetConfiguration);
          vm.filter = parseDataSetFilterGroup(vm.wranglingDataSetConfig.filter);
          vm.tables = [];
          for(var t = 0; t < vm.wranglingDataSetConfig.tables.length; t++) {
            addTable(vm.wranglingDataSetConfig.tables[t]);
          }
        });
    })
    .then(function() {
      notifyOnChange();
    })
    .catch(vm.catchServiceException);
  }

  function getTableName(temporary) {
    if(angular.isUndefined(temporary)) {
      temporary = false;
    }

    var table = vm.table;

    if(temporary) {
      table = vm.temporaryTable;
    }

    return table;
  }

  function saveDataSet(temporary) {
    var table = getTableName(temporary);

    var url = vm.apiHost + '/dataset/wrangling/' + vm.database + '/' + table;

    vm.wranglingDataSetConfig.tables = getTables();
    vm.wranglingDataSetConfig.filter = buildDataSetFilterGroup(vm.filter);

    var creationRequest = {
      comment: vm.dataSetRequest.comment,
      tags: vm.dataSetRequest.tags,
      temporary: temporary,
      dataSetConfig: vm.wranglingDataSetConfig
    };

    return $http.put(url, creationRequest)
      .catch(vm.catchServiceException);
  }

  function parseDataSetFilterGroup(filter) {
    var group = {
      operator: filter.operator,
      rules: []
    };

    if(filter.conditions) {
      for(var c = 0; c < filter.conditions.length; c++) {
        var rule = filter.conditions[c];

        var parsedRule = {
          condition: rule.condition,
          data: rule.data,
          field: {
            name: rule.database + '.' + rule.table + '.' + rule.column,
            groupName: rule.database + '.' + rule.table,
            database: rule.database,
            table: rule.table,
            column: rule.column
          }
        };

        parsedRule.field.name = rule.database + '.' + rule.table + '.' + getColumn(rule.database, rule.table, rule.column).newName;

        group.rules.push(parsedRule);
      }
    }

    if(filter.groups) {
      for(var g = 0; g < filter.groups.length; g++) {
        group.rules.push({
          group: parseDataSetFilterGroup(filter.groups[g])
        });
      }
    }

    return group;
  }

  function buildDataSetFilterGroup(group) {
    var filterGroup = group;

    var dataSetFilter = {
      operator: filterGroup.operator,
      conditions: [],
      groups: []
    };

    for(var r = 0; r < filterGroup.rules.length; r++) {
      var rule = filterGroup.rules[r];
      if(angular.isDefined(rule.group)) {
        dataSetFilter.groups.push(buildDataSetFilterGroup(rule.group));
      } else {
        dataSetFilter.conditions.push({
          condition: rule.condition,
          data: rule.data,
          database: rule.field.database,
          table: rule.field.table,
          column: rule.field.column
        });
      }
    }

    return dataSetFilter;
  }

  function getDataSet() {
    return {
      database: vm.database,
      name: vm.table,
      comment: vm.dataSetRequest.comment,
      tags: vm.dataSetRequest.tags
    };
  }

  function setDataSet(dataSet) {
    vm.dataSetRequest = {
      comment: dataSet.comment,
      tags: dataSet.tags
    };
  }

  function getFilter() {
    return vm.filter;
  }

  function setFilter(filter) {
    vm.filter = filter;
  }

  function loadTable(table) {
    vm.tables[table.database + '.' + table.table] = table;
    for(var i = 0; i < table.columns.length; i++) {
      var column = table.columns[i];
    }

    notifyOnChange();
  }

  function addTable(table) {
    if(getTables().length === 0) {
      table.primary = true;
    } else {
      table.primary = false;
    }

    vm.tables[table.database + '.' + table.table] = table;
    for(var i = 0; i < table.columns.length; i++) {
      var column = table.columns[i];
      column.newName = column.name;
      column.newType = column.type;
      column.newDescription = column.description;
      column.selected = true;
    }

    notifyOnChange();
  }

  function makeTablePrimary(database, table) {
    for (var key in vm.tables) {
      vm.tables[key].primary = false;
    }
    vm.tables[database + '.' + table].primary = true;

    notifyOnChange();
  }

  function getPrimaryTable() {
    for (var key in vm.tables) {
      if(vm.tables[key].primary) {
        return vm.tables[key];
      }
    }

    return null;
  }

  function getTables() {
    var arrayValues = [];

    for (var key in vm.tables) {
      if(vm.tables[key].primary) {
        arrayValues.unshift(vm.tables[key]);
      } else {
        arrayValues.push(vm.tables[key]);
      }
    }

    return arrayValues;
  }

  function getTable(database, table) {
    var key = database + '.' + table;

    return vm.tables[key];
  }

  function removeTable(database, table) {
    var toDelete = vm.tables[database + '.' + table];
    delete vm.tables[database + '.' + table];
    if(getTables().length === 0) {
      vm.calculatedColumns = [];
    } else if(toDelete.primary) {
      for (var key in vm.tables) {
        vm.tables[key].primary = true;
        break;
      }
    }

    var newLinks = [];
    // remove links related to this table
    for(var l = 0; l < vm.wranglingDataSetConfig.links.length; l++) {
      var link = vm.wranglingDataSetConfig.links[l];

      if(!(link.left.database.localeCompare(database) === 0 && link.left.table.localeCompare(table) === 0)) {
        newLinks.push(link);
      }
    }
    vm.wranglingDataSetConfig.links = newLinks;

    notifyOnChange();
  }

  function addCalculatedColumn(calculatedColumn) {
    vm.wranglingDataSetConfig.calculatedColumns.push(calculatedColumn);

    notifyOnChange();
  }

  function getCalculatedColumns() {
    return vm.wranglingDataSetConfig.calculatedColumns;
  }

  function removeCalculatedColumn(name) {
    for(var i = 0; i < vm.wranglingDataSetConfig.calculatedColumns.length; i++) {
      var calculatedColumn = vm.wranglingDataSetConfig.calculatedColumns[i];
      if(calculatedColumn.name.localeCompare(name) === 0) {
        vm.wranglingDataSetConfig.calculatedColumns.splice(i, 1);
        break;
      }
    }

    notifyOnChange();
  }

  vm.calculatedColumnSequence = 1;

  function getNextCalculatedColumnSequence() {
    vm.calculatedColumnSequence++;
    return vm.calculatedColumnSequence;
  }

  function getCalculatedColumn(name) {
    for(var i = 0; i < vm.wranglingDataSetConfig.calculatedColumns.length; i++) {
      var calculatedColumn = vm.wranglingDataSetConfig.calculatedColumns[i];
      if(calculatedColumn.name.localeCompare(name) === 0) {
        return calculatedColumn;
      }
    }

    return null;
  }

  function getColumn(database, table, name) {
    var tableItem = getTable(database, table);

    if(angular.isUndefined(tableItem)) {
      return null;
    }

    for(var i = 0; i < tableItem.columns.length; i++) {
      var column = tableItem.columns[i];
      if(column.name.localeCompare(name) === 0) {
        return column;
      }
    }

    return null;
  }

  function getLinks() {
    return vm.wranglingDataSetConfig.links;
  }

  function updateLinks(newLinks) {
    vm.wranglingDataSetConfig.links = newLinks;
    notifyOnChange();
  }

  function getData(maxRows) {
    if(vm.cancelCurrentGetData !== null) {
      vm.cancelCurrentGetData.resolve('New GetData');
    }
    vm.cancelCurrentGetData = null;

    if(angular.isUndefined(maxRows)) {
      maxRows = 10000;
    }

    if(Object.keys(vm.tables).length === 0) {
      return $q.when([]);
    }

    vm.cancelCurrentGetData = $q.defer();

    var url = vm.apiHost + '/dataset/wrangling/' + vm.database + '/' + vm.temporaryTable + '/preview?max=' + maxRows;
    var result = $http.get(url, {timeout: vm.cancelCurrentGetData.promise})
      .catch(vm.catchServiceException);

    return result;
  }

  function cancelGetData() {
    if(vm.cancelCurrentGetData !== null) {
      vm.cancelCurrentGetData.resolve('Cancel Get Data');
    }
    vm.cancelCurrentGetData = null;
  }

  function subscribeOnChange(scope, callback) {
    var handler = $rootScope.$on('onChange@preparationService', callback);
    scope.$on('$destroy', handler);
  }

  function notifyOnChange() {
    $rootScope.$emit('onChange@preparationService');
  }

  var service = {
    initDataSet: initDataSet,
    saveDataSet: saveDataSet,
    cloneDataSet: cloneDataSet,
    getDataSet: getDataSet,
    setDataSet: setDataSet,
    getFilter: getFilter,
    setFilter: setFilter,
    addTable: addTable,
    getTables: getTables,
    removeTable: removeTable,
    getTable: getTable,
    makeTablePrimary: makeTablePrimary,
    getPrimaryTable: getPrimaryTable,
    getColumn: getColumn,
    getData: getData,
    cancelGetData: cancelGetData,
    addCalculatedColumn: addCalculatedColumn,
    getCalculatedColumns: getCalculatedColumns,
    removeCalculatedColumn: removeCalculatedColumn,
    getCalculatedColumn: getCalculatedColumn,
    getNextCalculatedColumnSequence: getNextCalculatedColumnSequence,
    getLinks: getLinks,
    updateLinks: updateLinks,
    subscribeOnChange: subscribeOnChange,
    notifyOnChange: notifyOnChange
  };

  return service;
}

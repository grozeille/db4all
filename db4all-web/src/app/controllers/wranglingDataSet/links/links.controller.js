module.exports = {
  controller: LinksController,
  controllerAs: 'links',
  template: require('./links.html')
};

/** @ngInject */
function LinksController($timeout, $log, $location, $filter, $uibModalInstance, $state, database, table, wranglingDataSetService) {
  var vm = this;

  vm.leftTable = {
    database: database,
    table: table,
    id: database + '.' + table,
    label: database + '.' + table
  };

  vm.rightTableList = [];

  vm.links = [];

  vm.manageLinksOK = function() {
    $log.info('Modal OK at: ' + new Date());

    // update links, only for selected left database.table.column
    var links = wranglingDataSetService.getLinks();
    var newLinks = [];
    for(var l = 0; l < links.length; l++) {
      var link = links[l];

      if(link.left.database.localeCompare(vm.leftTable.database) !== 0 || link.left.table.localeCompare(vm.leftTable.table) !== 0) {
        newLinks.push(link);
      }
    }

    for(var ll = 0; ll < vm.links.length; ll++) {
      var controllerLink = vm.links[ll];
      var newLink = {
        left: {
          database: controllerLink.table.left.database,
          table: controllerLink.table.left.table
        },
        right: {
          database: controllerLink.table.right.database,
          table: controllerLink.table.right.table
        },
        type: controllerLink.type,
        columns: []
      };

      for(var c = 0; c < controllerLink.columns.length; c++) {
        var controllerColumn = controllerLink.columns[c];
        if(controllerColumn.left && controllerColumn.right) {
          var newColumn = {
            left: controllerColumn.left.name,
            right: controllerColumn.right.name
          };
          newLink.columns.push(newColumn);
        }
      }

      if(newLink.columns.length > 0) {
        newLinks.push(newLink);
      }
    }

    wranglingDataSetService.updateLinks(newLinks);

    wranglingDataSetService.notifyOnChange();
    $uibModalInstance.close();
  };

  vm.manageLinksCancel = function() {
    $log.info('Modal dismissed at: ' + new Date());
    $uibModalInstance.dismiss();
  };

  vm.addLink = function() {
    vm.links.push({
      table: {
        left: vm.leftTable,
        right: {
          database: '',
          table: '',
          id: '',
          label: ''
        }
      },
      columns: [],
      type: 'outer'
    });
  };

  vm.refreshColumns = function(index) {
    vm.links[index].columns = [{
      left: '',
      right: ''
    }];
  };

  vm.addColumn = function(index) {
    vm.links[index].columns.push({
      left: '',
      right: ''
    });
  };

  vm.removeColumn = function(linkIndex, columnIndex) {
    vm.links[linkIndex].columns.splice(columnIndex, 1);
    if(vm.links[linkIndex].columns.length === 0) {
      vm.addColumn(linkIndex);
    }
  };

  vm.isAddDisabled = function(index) {
    var columns = vm.links[index].columns;
    return !columns[columns.length - 1].left || !columns[columns.length - 1].right;
  };

  vm.removeLink = function(index) {
    vm.links.splice(index, 1);
  };

  vm.refreshLinks = function() {
    vm.refreshRightTableList();

    var links = wranglingDataSetService.getLinks();

    for(var l = 0; l < links.length; l++) {
      var link = links[l];

      var isInLeft = link.left.database.localeCompare(vm.leftTable.database) === 0 &&
        link.left.table.localeCompare(vm.leftTable.table) === 0;

      if(isInLeft) {
        var rightTable = vm.getRightTable(link.right.database, link.right.table);

        var linkItem = {
          table: {
            left: vm.leftTable,
            right: rightTable
          },
          columns: [],
          type: link.type
        };

        for(var c = 0; c < link.columns.length; c++) {
          var columnLink = link.columns[c];

          var rightColumn = vm.getColumn(rightTable, columnLink.right);
          var leftColumn = vm.getColumn(vm.leftTable, columnLink.left);

          linkItem.columns.push({
            left: leftColumn,
            right: rightColumn
          });
        }

        vm.links.push(linkItem);
      }
    }

    if(vm.links.length === 0) {
      vm.addLink();
    }
  };

  vm.getRightTable = function(database, table) {
    for(var t = 0; t < vm.rightTableList.length; t++) {
      var currentTable = vm.rightTableList[t];
      if(currentTable.database.localeCompare(database) === 0 && currentTable.table.localeCompare(table) === 0) {
        return currentTable;
      }
    }

    return null;
  };

  vm.getColumn = function(table, column) {
    for(var c = 0; c < table.columns.length; c++) {
      var currentColumn = table.columns[c];
      if(currentColumn.name.localeCompare(column) === 0) {
        return currentColumn;
      }
    }

    return null;
  };

  vm.refreshRightTableList = function() {
    vm.rightTableList = [];

    // TODO: don't include tables linked in the left side to avoid loop

    var tables = wranglingDataSetService.getTables();
    for(var t = 0; t < tables.length; t++) {
      var table = tables[t];
      var tableItem = {
        database: table.database,
        table: table.table,
        id: table.database + '.' + table.table,
        label: table.database + '.' + table.table,
        columns: []
      };

      // don't include table if selected as left table
      if(tableItem.id.localeCompare(vm.leftTable.id) === 0) {
        continue;
      }

      vm.rightTableList.push(tableItem);

      for(var c = 0; c < table.columns.length; c++) {
        var column = table.columns[c];
        tableItem.columns.push({
          name: column.name,
          newName: column.newName,
          id: column.name,
          label: column.newName
        });
      }
    }
  };

  vm.refreshLeftTable = function() {
    var table = wranglingDataSetService.getTable(vm.leftTable.database, vm.leftTable.table);
    vm.leftTable.columns = [];

    for(var c = 0; c < table.columns.length; c++) {
      var column = table.columns[c];
      vm.leftTable.columns.push({
        name: column.name,
        newName: column.newName,
        id: column.name,
        label: column.newName
      });
    }
  };

  vm.loadLinkImage = function(type) {
    return require('../../../assets/images/arrow_' + type + '.png');
  };

  activate();

  function activate() {
    vm.refreshLeftTable();
    vm.refreshLinks();
  }
}

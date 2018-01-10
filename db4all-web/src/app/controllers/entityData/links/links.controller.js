require('./links.css');

module.exports = {
  controller: LinksController,
  controllerAs: 'links',
  template: require('./links.html')
};

var Handsontable = require('Handsontable');

/** @ngInject */
function LinksController($timeout, $log, $location, $scope, $filter, $uibModalInstance, $document, entityService, projectId, entityId, sourceField, links, handsonTableRegistryService) {
  var vm = this;

  vm.alerts = [];

  vm.links = links;
  vm.projectId = projectId;
  vm.entityId = entityId;
  vm.sourceField = sourceField;

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
    height: 300,
    readOnly: true,
    colHeaders: true,
    rowHeaders: true,
    colWidths: [],
    columns: [],
    minSpareRows: 0,
    manualColumnResize: true,
    manualRowResize: false,
    columnSorting: true,
    autoColumnSize: false,
    onAfterChange: function(event, type) {
      vm.onAfterChange(this, event, type);
    }
  };
  vm.currentFilter = {operator: 'ET', rules: []};

  vm.canSelectAll = function() {
    return vm.sourceField.type === 'LINK_MULTIPLE';
  };

  vm.onAfterChange = function(core, events, type) {
    if(events !== null && vm.sourceField.type === 'LINK') {
      for(var eventCpt in events) {
        var event = events[eventCpt];
        var row = event[0];
        var col = core.propToCol(event[1]);
        var previousValue = event[2];
        var newValue = event[3];

        // set all other rows to false
        for(var rowCpt in vm.filteredData) {
          if(rowCpt !== String(row)) {
            vm.filteredData[rowCpt][event[1]] = false;
          }
        }
      }
      $scope.$apply();
    }
  };

  vm.load = function() {
    var linkSelected = {};
    for(var linkCpt in vm.links) {
      var linkValue = vm.links[linkCpt];
      linkSelected[linkValue.id] = true;
    }

    entityService.getById(vm.projectId, vm.entityId)
      .then(function(entity) {
        vm.entity = entity;
        if(angular.isUndefined(vm.entity.fields) || vm.entity.fields === null) {
          vm.entity.fields = [];
        }

        vm.settings.colWidths = [];
        vm.settings.columns = [];

        vm.settings.columns.push({
          title: 'Sélection',
          data: '##selection##',
          readOnly: false,
          renderer: 'checkbox',
          editor: 'checkbox'
        });
        vm.settings.colWidths.push(80);
        for(var cptField in vm.entity.fields) {
          var field = vm.entity.fields[cptField];

          var fieldWidth = 100;
          if(angular.isDefined(field.width) && field.width !== 0) {
            fieldWidth = field.width;
          }
          vm.settings.colWidths.push(fieldWidth);

          var column = {
            title: field.name,
            data: String(field.fieldId),
            readOnly: true
          };

          // TEXT,NUMERIC,DATE,BOOL,LINK,LINK_MULTIPLE
          if(field.type === 'TEXT') {
            column.editor = 'text';
            column.renderer = vm.maxLengthTextRenderer;
            if(angular.isDefined(field.maxLength)) {
              column.maxLength = field.maxLength;
            }
            else {
              column.maxLength = 0;
            }
          }
          else if(field.type === 'NUMERIC') {
            column.format = field.format;
            column.renderer = 'numeric';
          }
          else if(field.type === 'DATE') {
            // column.renderer = 'date';
            column.renderer = Handsontable.renderers.DateRenderer;
          }
          else if(field.type === 'BOOL') {
            column.renderer = 'checkbox';
          }
          else if(field.type === 'LINK') {
            column.renderer = vm.linkRenderer;
          }
          else if(field.type === 'LINK_MULTIPLE') {
            column.renderer = vm.linkRenderer;
          }
          vm.settings.columns.push(column);
        }

        return entityService.getData(vm.projectId, vm.entityId).then(function (data) {
          for(var cptData in data) {
            data[cptData]['##selection##'] = false;
            if(linkSelected[data[cptData]['#row_id#']]) {
              data[cptData]['##selection##'] = true;
            }
          }
          vm.data = data;
          vm.filteredData = vm.data;
        });
      })
      .catch(function(error) {
        vm.alerts.push({msg: 'Unable to get entity ' + vm.entityId + '.', type: 'danger'});
        throw error;
      });

    if(vm.sourceField.type === 'LINK') {
      $scope.$watch(function() {
        return vm.filteredData;
      }, function() {

      }, true);
    }
  };

  vm.linkRenderer = require('../renderer/linkRenderer.js').renderer;

  vm.maxLengthTextRenderer = require('../renderer/maxLengthTextRenderer.js').renderer;

  vm.ok = function() {
    $log.info('Modal OK at: ' + new Date());

    vm.links = [];
    for(var cptData in vm.data) {
      var row = vm.data[cptData];
      if(row['##selection##']) {
        vm.links.push({id: row['#row_id#'], display: row[sourceField.entityField]});
      }
    }
    $uibModalInstance.close(vm.links);
  };

  vm.cancel = function() {
    $log.info('Modal dismissed at: ' + new Date());
    $uibModalInstance.dismiss();
  };

  vm.selectAll = function() {
    for(var cptData in vm.filteredData) {
      vm.filteredData[cptData]['##selection##'] = true;
    }
  };

  vm.unselectAll = function() {
    for(var cptData in vm.filteredData) {
      vm.filteredData[cptData]['##selection##'] = false;
    }
  };

  function activate() {
    vm.load();
  }

  activate();
}

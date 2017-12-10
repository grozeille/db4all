require('./links.css');

module.exports = {
  controller: LinksController,
  controllerAs: 'links',
  template: require('./links.html')
};

var Handsontable = require('Handsontable');

/** @ngInject */
function LinksController($timeout, $log, $location, $filter, $uibModalInstance, entityService, projectId, entityId, sourceField, links) {
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
  vm.columns = [];
  vm.colWidths = [];
  vm.settings = {
    height: 500,
    readOnly: true,
    manualColumnResize: true,
    manualRowResize: false,
    columnSorting: true,
    autoColumnSize: false
  };
  vm.currentFilter = {operator: 'ET', rules: []};

  vm.refresh = function() {

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

        vm.colWidths = [];
        vm.columns = [];
        vm.columns.push({
          title: 'Sélection',
          data: '##selection##',
          readOnly: false,
          renderer: 'checkbox',
          editor: 'checkbox'
        });
        vm.colWidths.push(80);
        for(var cptField in vm.entity.fields) {
          var field = vm.entity.fields[cptField];

          var fieldWidth = 100;
          if(angular.isDefined(field.width) && field.width !== 0) {
            fieldWidth = field.width;
          }
          vm.colWidths.push(fieldWidth);

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
          vm.columns.push(column);
        }

        return entityService.getData(vm.projectId, vm.entityId).then(function (data) {
          for(var cptData in data) {
            data[cptData]['##selection##'] = false;
            if(linkSelected[cptData]) {
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
  };

  vm.linkRenderer = function(hotInstance, td, row, column, prop, value, cellProperties) {
    // Optionally include `BaseRenderer` which is responsible for adding/removing CSS classes to/from the table cells.
    Handsontable.renderers.BaseRenderer.apply(this, arguments);

    if(angular.isDefined(value) && value !== null && value instanceof Array) {
      var linkValue = [];
      for(var linkCpt in value) {
        linkValue.push(value[linkCpt].display);
      }
      td.innerHTML = linkValue.join(', ');
    }

    return td;
  };

  vm.maxLengthTextRenderer = function(instance, td, row, col, prop, value, cellProperties) {
    var escaped = Handsontable.helper.stringify(value);
    var maxLength = instance.getCellMeta(row, col).maxLength;

    if(maxLength > 0 && escaped.length > maxLength) {
      escaped = escaped.substring(0, maxLength) + '...';
    }

    td.innerHTML = escaped;

    return td;
  };

  vm.ok = function() {
    $log.info('Modal OK at: ' + new Date());

    vm.links = [];
    for(var cptData in vm.data) {
      var row = vm.data[cptData];
      if(row['##selection##']) {
        vm.links.push({id: cptData, display: row[sourceField.entityField]});
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

  activate();

  function activate() {
    vm.refresh();
  }
}

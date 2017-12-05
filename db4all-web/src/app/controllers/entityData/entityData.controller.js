require('./entityData.css');

module.exports = {
  controller: EntityDataController,
  controllerAs: 'entityData',
  template: require('./entityData.html')
};

var Handsontable = require('Handsontable');

/** @ngInject */
function EntityDataController($scope, $log, $uibModal, $stateParams, $document, entityService, hotRegisterer, hotkeys) {
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
            column.renderer = vm.maxLengthTextRenderer;
            if(angular.isDefined(field.maxLength)) {
              column.maxLength = field.maxLength;
            }
            else {
              column.maxLength = 0;
            }
          }
          else if(field.type === 'NUMERIC') {
            column.editor = 'numeric';
            column.format = field.format;
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
            if(field.linkType === 'DROPDOWN') {
              column.editor = vm.linkSimpleEditor;
              column.selectOptions = {
                1: 'Ceci est un test',
                2: 'Ceci est un test 2'
              };
              column.renderer = vm.linkRenderer;
            }
            else {
              column.editor = vm.linkEditor;
              column.renderer = vm.linkRenderer;
            }
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
      if(this.getDataAtCell(row, column) === null) {
        vm.currentColumn = '';
      }
      else if(this.getDataAtCell(row, column) === '') {
        vm.currentColumn = '';
      }
      else {
        var linkValue = [];
        var value = this.getDataAtCell(row, column);
        for(var linkCpt in value) {
          linkValue.push(value[linkCpt].display);
        }
        vm.currentColumn = linkValue.join(', ');
      }
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
      this.linksModal.size = 'wide';
      this.linksModal.appendTo = angular.element($document.find('#modal-link'));
      // angular.element('#modal-link')[0];
      this.linksModal.windowClass = 'modal-window-wide';
      this.linksModal.resolve = {};
    };

    vm.linkEditor.prototype.getValue = function() {
      return this.value;
    };

    vm.linkEditor.prototype.setValue = function(value) {
      if(this.originalValue === '' || angular.isUndefined(this.originalValue)) {
        this.originalValue = [];
      }

      var field = vm.fields[this.prop];
      var linkProjectId = vm.projectId;
      var linkEntityId = field.entityId;
      var originalValue = this.originalValue;

      /* this.linksModal.resolve.entityService = function () {
        return entityService;
      }; */
      this.linksModal.resolve.projectId = function () {
        return linkProjectId;
      };
      this.linksModal.resolve.entityId = function () {
        return linkEntityId;
      };
      this.linksModal.resolve.links = function () {
        return originalValue;
      };
      this.linksModal.resolve.sourceField = function () {
        return field;
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

    vm.linkSimpleEditor = Handsontable.editors.BaseEditor.prototype.extend();

    vm.linkSimpleEditor.prototype.init = function() {
      // Create detached node, add CSS class and make sure its not visible
      this.select = $document[0].createElement('ul');
      // Handsontable.dom.addClass(this.select, 'htSelectEditor');
      Handsontable.dom.addClass(this.select, 'linkSimpleEditor');
      Handsontable.dom.addClass(this.select, 'dropdown-menu');
      this.select.style.display = 'none';

      // Attach node to DOM, by appending it to the container holding the table
      this.instance.rootElement.appendChild(this.select);
    };

    // Create options in prepare() method
    vm.linkSimpleEditor.prototype.prepare = function() {
      // Remember to invoke parent's method
      Handsontable.editors.BaseEditor.prototype.prepare.apply(this, arguments);

      var selectOptions = this.cellProperties.selectOptions;
      var options;

      if (angular.isFunction(selectOptions)) {
        options = this.prepareOptions(selectOptions(this.row, this.col, this.prop));
      } else {
        options = this.prepareOptions(selectOptions);
      }
      Handsontable.dom.empty(this.select);

      var editor = this;
      var onclick = function(e) {
        e.preventDefault();
        // editor.select.value = this.value;
        editor.select.value = [{id: this.value, display: this.innerHTML}];
        editor.instance.destroyEditor(false);
      };

      for (var option in options) {
        var optionElement = $document[0].createElement('li');
        var hrefElement = $document[0].createElement('a');
        optionElement.appendChild(hrefElement);
        hrefElement.href = '#';
        hrefElement.value = option;
        hrefElement.onclick = onclick;
        Handsontable.dom.fastInnerHTML(hrefElement, options[option]);
        this.select.appendChild(optionElement);
      }
    };

    vm.linkSimpleEditor.prototype.prepareOptions = function(optionsToPrepare) {
      var preparedOptions = {};

      if (angular.isArray(optionsToPrepare)) {
        for(var i = 0, len = optionsToPrepare.length; i < len; i++) {
          preparedOptions[optionsToPrepare[i]] = optionsToPrepare[i];
        }
      } else if (angular.isObject(optionsToPrepare)) {
        preparedOptions = optionsToPrepare;
      }

      return preparedOptions;
    };

    vm.linkSimpleEditor.prototype.getValue = function() {
      vm.filteredData[this.row][this.prop] = this.select.value;
      return vm.filteredData[this.row][this.prop];
    };

    vm.linkSimpleEditor.prototype.setValue = function(value) {
      if(angular.isDefined(vm.filteredData[this.row][this.prop]) && angular.isDefined(vm.filteredData[this.row][this.prop][0]) && angular.isDefined(vm.filteredData[this.row][this.prop][0].id)) {
        this.select.value = vm.filteredData[this.row][this.prop];
        for(var cptNode = 0; cptNode < this.select.childNodes.length; cptNode++) {
          var li = this.select.childNodes[cptNode];
          if(li.childNodes[0].value === this.select.value[0].id) {
            Handsontable.dom.addClass(li.childNodes[0], 'selected');
          }
          else {
            Handsontable.dom.removeClass(li.childNodes[0], 'selected');
          }
        }
      }
    };

    vm.linkSimpleEditor.prototype.open = function() {
      var width = Handsontable.dom.outerWidth(this.TD);
      var height = Handsontable.dom.outerHeight(this.TD);
      var rootOffset = Handsontable.dom.offset(this.instance.rootElement);
      var tdOffset = Handsontable.dom.offset(this.TD);

      // sets select dimensions to match cell size
      // this.select.style.height = height + 'px';
      // this.select.style.minWidth = width + 'px';

      // make sure that list positions matches cell position
      this.select.style.top = tdOffset.top - rootOffset.top + height + 'px';
      this.select.style.left = tdOffset.left - rootOffset.left + 'px';
      this.select.style.margin = '0px';

      // display the list
      this.select.style.display = '';
    };

    vm.linkSimpleEditor.prototype.close = function() {
      this.select.style.display = 'none';
    };

    vm.linkSimpleEditor.prototype.focus = function() {
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

    hotkeys.bindTo($scope)
    .add({
      combo: 'mod+s',
      description: 'Save',
      callback: function(event, hotkey) {
        event.preventDefault();
        vm.save();
      }
    });

    vm.refresh();
  }

  activate();
}

require('./fieldEditor.css');

module.exports = fieldEditor;

/** @ngInject */
function fieldEditor($compile, $log) {
  function compile(element, attrs) {
    var content;
    var directive;
    // content = element.contents().remove();
    if(angular.isUndefined(attrs.canChangeType) || attrs.canChangeType === '') {
      attrs.canChangeType = true;
    }

    if(attrs.canChangeType === 'true' || attrs.canChangeType === true) {
      attrs.canChangeType = true;
    }
    else {
      attrs.canChangeType = false;
    }

    return function(scope, element, attrs) {
      scope.onSelectEntityCallback = function(item, model) {
        scope.field.entityId = model.id;
        scope.selectedEntity = model;
        if(scope.selectedEntity.fields.length > 0) {
          scope.selectedField = scope.selectedEntity.fields[0];
          scope.field.entityField = scope.selectedField.fieldId;
        }
        else {
          scope.selectedField = null;
        }
      };

      scope.onSelectFieldCallback = function(item, model) {
        scope.field.entityField = model.fieldId;
        scope.selectedField = model;
      };

      scope.fieldTypeText = function(fieldType) {
        if(fieldType === 'TEXT') {
          return 'Text';
        }
        else if(fieldType === 'NUMERIC') {
          return 'Numérique';
        }
        else if(fieldType === 'BOOL') {
          return 'Vrai/Faux';
        }
        else if(fieldType === 'DATE') {
          return 'Date';
        }
        else if(fieldType === 'LINK') {
          return 'Lien Table';
        }
        else if(fieldType === 'LINK_MULTIPLE') {
          return 'Lien Table Multiple';
        }
      };

      scope.update = function() {
        if(scope.field.type === 'LINK') {
          if(angular.isUndefined(scope.field.linkType) || scope.field.linkType === null) {
            scope.field.linkType = 'DROPDOWN';
          }
        }
      };

      scope.filterLinkFields = function(selection) {
        return function(item) {
          return item.type !== 'LINK' && item.type !== 'LINK_MULTIPLE' && (selection === '' || item.name.indexOf(selection) !== -1);
        };
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
    transclude: true,
    scope: {
      field: '=',
      entities: '=',
      selectedEntity: '=',
      selectedField: '=',
      canChangeType: '@',
      refreshEntities: '='
    },
    template: require('./fieldEditor.html'),
    compile: compile
  };

  return directive;
}

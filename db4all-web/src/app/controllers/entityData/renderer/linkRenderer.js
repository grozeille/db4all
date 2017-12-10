var Handsontable = require('Handsontable');

module.exports = {
  renderer: function(hotInstance, td, row, column, prop, value, cellProperties) {
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
  }
};

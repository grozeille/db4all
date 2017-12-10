var Handsontable = require('Handsontable');

module.exports = {
  renderer: function(instance, td, row, col, prop, value, cellProperties) {
    var escaped = Handsontable.helper.stringify(value);
    var maxLength = instance.getCellMeta(row, col).maxLength;

    if(maxLength > 0 && escaped.length > maxLength) {
      escaped = escaped.substring(0, maxLength) + '...';
    }

    td.innerHTML = escaped;

    return td;
  }
};

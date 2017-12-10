module.exports = filterFilter;

function filterFilter() {
  var newItem = {
    isNew: true,
    name: 'new',
    filter: {operator: 'ET', rules: []}
  };

  return function(items, filter) {
    var out = [];

    if(angular.isArray(items)) {
      var exactMatch = false;

      items.forEach(function(item) {
        var itemMatches = false;

        if(item.name.toString().toLowerCase().indexOf(filter.name) !== -1) {
          itemMatches = true;
          if(item.name.toString().toLowerCase() === filter.name) {
            exactMatch = true;
          }
        }

        if(itemMatches) {
          out.push(item);
        }
      });

      if(filter.allowNew && !exactMatch && filter.name.length > 0) {
        newItem.name = filter.name.trim();
        out.push(newItem);
      }
    } else {
      // Let the output be the input untouched
      out = items;
    }

    return out;
  };
}

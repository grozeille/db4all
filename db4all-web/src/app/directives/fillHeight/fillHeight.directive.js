module.exports = fillHeight;

/** @ngInject */
function fillHeight($window, $log) {
  var computeHeight = function(scope, elem, attrs) {
    var winHeight = $window.innerHeight;

    var headerHeight = 0;

    if(attrs.fillHeight) {
      angular.forEach($('.' + attrs.fillHeight), function(value, key) {
        headerHeight += $(value).outerHeight();

        if(angular.isUndefined(value.fillHeightWatch)) {
          value.fillHeightWatch = true;

          scope.$watch(
            function () {
              return {
                height: $(value).outerHeight()
              };
            },
            function () {
              $log.info(' Element resized! ');
              computeHeight(scope, elem, attrs);
            }, // listener
            true // deep watch
          );
        }
      });
    }

    elem.css('height', winHeight - headerHeight - 60 + 'px');
    elem.css('min-height', '200px');
  };

  var directive = {
    // restrict: 'A',
    link: function (scope, elem, attrs) {
      var win = angular.element($window);
      win.bind('resize', function(e) {
        $log.info(' Window resized! ');
        computeHeight(scope, elem, attrs);
      });

      computeHeight(scope, elem, attrs);
    }
  };

  return directive;
}


'use strict';

spotinode.directive('snIndexProgress', function(IndexProgress) {
  return {
    templateUrl: '/views/index-progress-bar.html',
    replace: true,
    link: function(scope) {
      scope.isIndexing = IndexProgress.isIndexing;

      scope.getProgress = function() {
        var status = IndexProgress.getStatus();

        return status.progress;
      };
    }
  };
});

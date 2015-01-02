'use strict';

spotinode.controller('ArtistsOverviewCtrl', function($rootScope, $scope, $location, $timeout, $routeParams, Artists, PaginationHelper, PAGINATION) {

  var pagination = $scope.pagination = PaginationHelper.create('artists');

  function resetArtistsPath() {
    $location.path('/artists/' + pagination.currentPage, false).replace();
  }

  pagination.setFetchFunction(Artists.query);

  pagination.on(PAGINATION.EVENTS.FETCHED, function(evt, artists) {
    $scope.artists = artists;

    var artistParam = $routeParams.artist,
        artist = null;

    if (artistParam) {
      delete $routeParams.artist;

      artist = _.findWhere(artists, {
        slug: artistParam
      });

      artist && $timeout(function() {
        $('#' + artist._id).trigger('click');
      });
    }
  });

  pagination.on(PAGINATION.EVENTS.CHANGED, resetArtistsPath);

  pagination.fetch($routeParams.page);

  var unbindFunction = $rootScope.$on('event:closed-card', resetArtistsPath);
  $scope.$on('$destroy', function() {
    unbindFunction();
    pagination.destroy();
  });
});

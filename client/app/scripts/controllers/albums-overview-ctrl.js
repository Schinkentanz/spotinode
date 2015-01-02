'use strict';

spotinode.controller('AlbumsOverviewCtrl', function($rootScope, $scope, $q, $location, $timeout, $routeParams, Albums, PAGINATION, PaginationHelper) {


  var pagination = $scope.pagination = PaginationHelper.create('albums');

  function resetAlbumsPath() {
    $location.path('/albums/' + pagination.currentPage, false).replace();
  }

  pagination.setFetchFunction(Albums.query);

  pagination.on(PAGINATION.EVENTS.FETCHED, function(evt, albums) {
    $scope.albums = albums;

    var albumParam = $routeParams.album,
        album = null;

    if (albumParam) {
      delete $routeParams.album;

      album = _.findWhere(albums, {
        slug: albumParam
      });

      album && $timeout(function() {
        $('#' + album._id).trigger('click');
      });
    }
  });

  pagination.on(PAGINATION.EVENTS.CHANGED, resetAlbumsPath);

  pagination.fetch($routeParams.page);

  var unbindFunction = $rootScope.$on('event:closed-card', resetAlbumsPath);
  $scope.$on('$destroy', function() {
    unbindFunction();
    pagination.destroy();
  });
});

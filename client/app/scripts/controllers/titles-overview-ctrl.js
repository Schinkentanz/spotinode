'use strict';

spotinode.controller('TitlesOverviewCtrl', function($rootScope, $scope, $location, $routeParams, Titles, ImageHelper, IMAGE_SIZES, PaginationHelper, PAGINATION) {

  var pagination = $scope.pagination = PaginationHelper.create('titles');

  function setPath() {
    $location.path('/titles/' + pagination.currentPage, false).replace();
  }

  pagination.setFetchFunction(Titles.query);

  pagination.on(PAGINATION.EVENTS.FETCHED, function(evt, titles) {
    $scope.titles = titles;
  });

  pagination.on(PAGINATION.EVENTS.CHANGED, setPath);

  pagination.fetch($routeParams.page);
});

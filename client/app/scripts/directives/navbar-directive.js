'use strict';

spotinode.directive('snNavbar', function() {
  return {
    templateUrl: '/views/navbar.html',
    controller: 'NavbarCtrl'
  };
}).controller('NavbarCtrl', function($scope, IndexProgress, Titles, Player) {
  $scope.showSearch = function(show) {
    $scope.showSearchCard = show;
  };

  $scope.showSettings = function(show) {
    $scope.showSettingsCard = show;
  };

  $scope.startIndex = function() {
    IndexProgress.start();
  };

  $scope.playRandom = function() {
    Titles.random(function(titles) {
      Player.playTitles(titles);
    });
  };

  $scope.isIndexing = IndexProgress.isIndexing;
});

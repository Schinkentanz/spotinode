'use strict';

spotinode.directive('snSearchCard', function(CardHelper) {
  return {
    replace: true,
    priority: 1,
    controller: 'SearchCtrl',
    templateUrl: '/views/search-card.html',
    link: function(scope, card) {

      function showSearchCard() {
        var button = $('nav .fa-search').parent(),
            closeCallback = function() {
              scope.showSearch(false);
            };

        scope.openCard(button, closeCallback)
          .then(function() {
            CardHelper.finalizePosition(card)
              .then(function() {
                scope.isLoading = false;
                $('input').trigger('focus');
              });
          });
      }

      showSearchCard();
    }
  };
}).controller('SearchCtrl', function($scope, $timeout, $http, Settings) {

  function updateSearch() {
    var value = $scope.query.trim();

    if (!value) { return; }

    $http.get(Settings.apiPrefix + '/search?query=' + value)
      .then(function(result) {
        var data = result.data,
            haveData = _.some(data, function(value) {
              return value.length;
            });

        $scope.data = data;
        $scope.haveData = haveData;
      });
  }

  $scope.haveData = true;

  var debouncedUpdate = _.debounce(updateSearch, 500);
  $scope.updateSearch = function() {
    $scope.haveData = true;
    debouncedUpdate();
  };

});

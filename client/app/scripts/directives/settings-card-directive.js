'use strict';

spotinode.directive('snSettingsCard', function(CardHelper) {
  return {
    replace: true,
    priority: 1,
    controller: 'SettingsCtrl',
    templateUrl: '/views/settings-card.html',
    link: function(scope, card) {

      function showSettingsCard() {
        var button = $('nav .fa-cogs').parent(),
            closeCallback = function() {
              scope.showSettings(false);
            };

        scope.openCard(button, closeCallback)
          .then(function() {
            CardHelper.finalizePosition(card)
              .then(function() {
                scope.isLoading = false;
              });
          });
      }

      showSettingsCard();
    }
  };
}).controller('SettingsCtrl', function($scope, Settings) {
  $scope.settings = Settings;

  var folders = $scope.folders = _.clone(Settings.folders).map(function(folder) {
    return {
      path: folder
    };
  });

  $scope.addFolder = function() {
    folders.push({
      path: '/path/to/my/awesome/music'
    });
  };

  $scope.removeFolder = function(folder) {
    folders.splice(folders.indexOf(folder), 1);
  };

  $scope.saveSettings = function() {
    if (!folders.length) { return; }

    $scope.isLoading = true;

    Settings.folders = folders.map(function(folder) {
      return folder.path
    });

    Settings.save().then(function(arg) {
      $scope.closeCard();
    });
  };

});

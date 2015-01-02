'use strict';

spotinode.service('Settings', function($rootScope, $timeout, $resource, $route, PAGINATION) {

  var settings = {
    api: $resource('/settings'),
    update: function(result) {
      _.extend(settings, result);
      PAGINATION.LIMIT = settings.requestLimit;

      $timeout(function() {
        $rootScope.$emit('event:settings');
        $route.reload();
      });
    },
    get: function () {
      return settings.api.get().$promise
        .then(settings.update);
    },
    save: function() {
      return settings.api.save(settings).$promise
        .then(settings.update);
    }
  };

  settings.get();

  return settings;
});

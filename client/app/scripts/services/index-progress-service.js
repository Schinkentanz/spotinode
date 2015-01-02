'use strict';

spotinode.service('IndexProgress', function($rootScope, $http, Settings) {

  var status = {};

  function start() {
    if (status.isIndexing) { return; }

    status.progress = 0;
    status.isIndexing = true;
    $http.get(Settings.apiPrefix + '/index', {
      ignoreLoadingBar: true
    }).then(listen);
  }

  function listen() {
    $http.get(Settings.apiPrefix + '/status', {
      ignoreLoadingBar: true
    }).then(function(result) {
      status = result.data;

      if (!status.isIndexing) { return; }

      setTimeout(listen, 1000);
    });
  }

  $rootScope.$on('event:settings', listen);

  return {
    start: start,
    isIndexing: function() {
      return status.isIndexing;
    },
    getStatus: function() {
      return status;
    }
  };
});

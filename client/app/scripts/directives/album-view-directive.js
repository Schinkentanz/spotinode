'use strict';

spotinode.directive('snAlbumView', function() {
  return {
    replace: true,
    templateUrl: '/views/album-view.html',
    link: function(scope, elem, attrs) {
      scope.showArtistName = 'showArtistName' in attrs;
    }
  };
});

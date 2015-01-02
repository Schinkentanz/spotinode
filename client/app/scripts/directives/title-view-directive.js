'use strict';

spotinode.directive('snTitleView', function(Player) {
  return {
    templateUrl: '/views/title-view.html',
    replace: true,
    link: function(scope, elem, attrs) {
      scope.hideAdd = 'hideAdd' in attrs;
      scope.showArtistName = 'showArtistName' in attrs;
      scope.showAlbumName = 'showAlbumName' in attrs;
      scope.showIndexNumber = 'showIndexNumber' in attrs;

      scope.addToPlaylist = function(evt, title) {
        scope.stopPropagation(evt);
        Player.addToPlaylist(title);
      };
    }
  };
});

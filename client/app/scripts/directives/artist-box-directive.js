'use strict';

spotinode.directive('snArtistBox', function($location, ImageHelper, IMAGE_SIZES) {
  return {
    templateUrl: '/views/artist-box.html',
    replace: true,
    link: function(scope, elem, attrs) {

      ImageHelper.getImage(scope.artist, IMAGE_SIZES.XL);

      scope.lazyOptions = JSON.stringify({
        background: true,
        nolazy: 'disableLazyLoad' in attrs
      });

      scope.showArtistCard = function(artist) {

        artist.showCard = true;

        if (scope.pagination) {
          $location.path('/artists/' + scope.pagination.currentPage + '/' + artist.slug, false);
        }
      };
    }
  };
});

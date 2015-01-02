'use strict';

spotinode.directive('snAlbumBox', function($rootScope, $location, ImageHelper, IMAGE_SIZES) {
  return {
    templateUrl: '/views/album-box.html',
    replace: true,
    link: function(scope, elem, attrs) {

      ImageHelper.getImage(scope.album, $rootScope.isBoxView ? IMAGE_SIZES.XL : IMAGE_SIZES.L);

      scope.lazyOptions = JSON.stringify({
        background: true,
        nolazy: 'disableLazyLoad' in attrs
      });

      scope.showAlbumCard = function(album) {

        album.showCard = true;

        if (scope.pagination) {
          $location.path('/albums/' + scope.pagination.currentPage + '/' + album.slug, false);
        }
      };
    }
  };
});

'use strict';

spotinode.directive('snAlbumCard', function($q, $sce, CardHelper, ImageHelper, IMAGE_SIZES, Titles) {
  return {
    templateUrl: '/views/album-card.html',
    replace: true,
    link: function(scope, card) {

      function trustBioOrWikiHTML(object) {
        var key = object.bio ? 'bio' : 'wiki';

        if (angular.isString(object[key])) {
          object[key] = $sce.trustAsHtml(object[key].replace(/[\n]/g, '<br>'));
        }
      }

      function loadTitles() {
        return Titles.getByAlbum({
          album: album.slug
        }).$promise;
      }

      function showAlbumCard() {
        scope.isLoading = true;

        var albumBox = card.closest('.album-box'),
            closeCallback = function() {
              album.showCard = false;
            };

        scope.openCard(albumBox, closeCallback)
          .then(loadTitles)
          .then(function(result) {
            var titles = result.data;

            CardHelper.finalizePosition(card)
              .then(function() {
                scope.isLoading = false;

                album.titles = titles;
              });
          });
      }

      var album = scope.album;

      ImageHelper.getImage(album, IMAGE_SIZES.XL);

      trustBioOrWikiHTML(album);
      trustBioOrWikiHTML(album.artists);

      showAlbumCard();
    }
  };
});

'use strict';

spotinode.directive('snArtistCard', function($q, $sce, $timeout, CardHelper, ImageHelper, IMAGE_SIZES, Albums, Titles) {
  return {
    templateUrl: '/views/artist-card.html',
    replace: true,
    link: function(scope, card) {

      var artist = scope.artist;

      function trustBioOrWikiHTML(object) {
        var key = object.bio ? 'bio' : 'wiki';

        if (angular.isString(object[key])) {
          object[key] = $sce.trustAsHtml(object[key].replace(/[\n]/g, '<br>'));
        }
      }

      function loadAlbums() {
        return Albums.getByArtist({
          artist: artist.slug,
          limit: 999
        }).$promise;
      }

      function loadTitles() {
        return Titles.getByArtist({
          artist: artist.slug,
          limit: 999
        }).$promise;
      }

      function showAlbums() {
        scope.showAlbumsTab = true;
      }

      function showTitles() {
        scope.showAlbumsTab = false;
      }

      function showArtistPage() {
        scope.isLoading = true;

        var artistBox = card.closest('.artist-box'),
            closeCallback = function() {
              artist.showCard = false;
            };

        scope.openCard(artistBox, closeCallback)
          .then(function() {
            return $q.all([
              loadAlbums(),
              loadTitles()
            ]);
          })
          .then(function(results) {
            var albums = results[0].data,
                titles = results[1].data;

            CardHelper.finalizePosition(card)
              .then(function() {
                scope.isLoading = false;

                if (!albums.length) {
                  scope.showTitles();
                }

                ImageHelper.getImages(albums, IMAGE_SIZES.XL);
                albums.forEach(trustBioOrWikiHTML);

                scope.albums = albums;
                scope.titles = titles;
              });
          });
      }

      trustBioOrWikiHTML(artist);

      showAlbums();
      showArtistPage();

      scope.showAlbums = showAlbums;
      scope.showTitles = showTitles;
    }
  };
});

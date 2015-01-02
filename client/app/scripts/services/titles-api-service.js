'use strict';

spotinode.service('Titles', function($resource, Settings) {
  return $resource(Settings.apiPrefix + '/titles/:slug', {
    limit: '@limit',
    skip: '@skip',
    slug: '@slug'
  }, {
    query: {
      cache: true,
      method: 'GET'
    },
    random: {
      method: 'GET',
      isArray: true,
      url: Settings.apiPrefix + '/random'
    },
    getByArtist: {
      cache: true,
      method: 'GET',
      url: Settings.apiPrefix + '/artists/:artist/titles',
      params: {
        artist: '@artist'
      }
    },
    getByAlbum: {
      cache: true,
      method: 'GET',
      url: Settings.apiPrefix + '/albums/:album/titles',
      params: {
        album: '@album'
      }
    }
  });
});

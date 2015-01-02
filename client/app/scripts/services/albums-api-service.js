'use strict';

spotinode.service('Albums', function($resource, Settings) {
  return $resource(Settings.apiPrefix + '/albums/:slug', {
    limit: '@limit',
    skip: '@skip',
    slug: '@slug'
  }, {
    query: {
      cache: true,
      method: 'GET'
    },
    getByArtist: {
      cache: true,
      method: 'GET',
      url: Settings.apiPrefix + '/artists/:artist/albums',
      params: {
        artist: '@artist'
      }
    }
  });
});

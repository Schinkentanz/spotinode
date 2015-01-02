'use strict';

spotinode.service('Artists', function($resource, Settings) {
  return $resource(Settings.apiPrefix + '/artists/:slug', {
    limit: '@limit',
    skip: '@skip',
    slug: '@slug'
  }, {
    query: {
      cache: true,
      method: 'GET'
    }
  });
});

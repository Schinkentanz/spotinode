var Promise = require('bluebird'),
    _ = require('underscore'),
    slug = require('slug'),
    filewalker = require('filewalker'),
    taglib = require('taglib'),
    LastFmNode = require('lastfm').LastFmNode,
    moment = require('moment'),
    express = require('express'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    compression = require('compression'),
    morgan = require('morgan'),
    Canvas = require('canvas'),
    mongoose = require('mongoose'),
    timestamps = require('mongoose-timestamp'),
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;

function getTagViaTaglib(filePath) {
  return new Promise(function(resolve, reject) {
    taglib.read(filePath, function(err, tag, audioProperties) {
      if (err) { reject(err); }

      resolve(_.extend(tag, audioProperties));
    });
  })
}

var files = [],
artists = [],
albums = [],
genres = [],
filePath = '/Volumes/931 E1/musik/Mzee.com ForumSampler Vol.1/05. zeeh - Spuren im Schnee (Produced by zeeh).mp3';

getTagViaTaglib(filePath).then(function(taglibTag) {
    console.log(taglibTag)
    if (_.isEmpty(taglibTag) || !taglibTag.artist || !taglibTag.title) { return; }


          var file = createInstance(files, 'path', filePath, filePath),
              artistSlug = slug(taglibTag.artist.name) || taglibTag.artist.name,
              artist = createInstance(artists, 'name', taglibTag.artist, artistSlug),
              hasAlbum = !!taglibTag.album,
              album = {},
              albumSlug = hasAlbum ? slug(taglibTag.album.name) || taglibTag.album.name : '',
              title = {},
              titleSlug = artistSlug,
              genre = {},
              genreSlug = '';

          if (hasAlbum) {
            titleSlug += ' - ' + albumSlug;
          }
          titleSlug += ' - ' + (slug(taglibTag.title) || taglibTag.title);

          title = createInstance(titles, 'name', taglibTag.title, titleSlug);

          if (taglibTag.genre) {
            genreSlug = slug(taglibTag.genre) || taglibTag.genre;
            genre = createInstance(genres, 'name', taglibTag.genre, genreSlug)
          }

          if (taglibTag.album) {
            album = createInstance(albums, 'name', taglibTag.album, albumSlug);

            album.artists = album.artists || [];
            if (album.artists.indexOf(artist._id) < 0) {
              album.artists.push(artist._id);
            }

            album.genre = genre._id;
            album.titles = album.titles || [];
            album.titles.push(title._id);
          }

          title.duration = taglibTag.length * 1000;
          title.artist = artist._id;
          title.album = album._id;
          title.genre = genre._id;
          title.file = file._id;

          file.album = album._id;
          file.title = title._id;
          file.artist = artist._id;
          file.genre = genre._id;
})


function createInstance(array, key, value, slugValue) {
  value = value || 'N/A';

  slugValue = slugValue.toLowerCase();

  var element = null,
      found = _.findWhere(array, {
        slug: slugValue
      });

  if (found) {
    return found;
  }

  element = {};
  element[key] = value;

  array.push(_.extend(element, {
    slug: slugValue
  }));

  return element;
}

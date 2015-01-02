var Promise = require('bluebird'),
    _ = require('underscore'),
    slug = require('slug'),
    walk = require('walk'),
    crypto = require('crypto'),
    taglib = require('taglib'),
    LastFmNode = require('lastfm').LastFmNode,
    acoustid = require('acoustid'),
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

// schemas
var SettingsSchema = new Schema({
  folders: [String],
  extensions: [String],
  apiPrefix: String,
  dbName: String,

  requestLimit: Number,
  fileConcurrency: Number,

  acoustIdKey: String,
  acoustIdConcurrency: Number,

  lastFmKey: String,
  lastFmSecret: String,
  lastFmUseragent: String,
  lastFmConcurrency: Number
});
SettingsSchema.plugin(timestamps);
mongoose.model('Settings', SettingsSchema);

var ArtistSchema = new Schema({
  name: String,
  slug: String,
  bio: String,
  images: Object
});
ArtistSchema.plugin(timestamps);
ArtistSchema.index({
  '$**': 'text'
}, {
  weights: {
    name: 10,
    bio: 2,
  },
  name: 'TextIndex'
});
mongoose.model('Artist', ArtistSchema);

var AlbumSchema = new Schema({
  name: String,
  slug: String,
  wiki: String,
  images: Object,
  date: Date,
  artists: [{
    type: ObjectId,
    ref: 'Artist'
  }],
  titles: [{
    type: ObjectId,
    ref: 'Title'
  }],
  genre: {
    type: ObjectId,
    ref: 'Genre'
  }
});
AlbumSchema.plugin(timestamps);
AlbumSchema.index({
  '$**': 'text'
}, {
  weights: {
    name: 10,
    wiki: 2,
  },
  name: 'TextIndex'
});
mongoose.model('Album', AlbumSchema);

var TitleSchema = new Schema({
  name: String,
  slug: String,
  wiki: String,
  duration: Number,
  track: Number,
  artist: {
    type: ObjectId,
    ref: 'Artist'
  },
  album: {
    type: ObjectId,
    ref: 'Album'
  },
  genre: {
    type: ObjectId,
    ref: 'Genre'
  },
  file: {
    type: ObjectId,
    ref: 'File'
  }
});
TitleSchema.plugin(timestamps);
TitleSchema.index({
  '$**': 'text'
}, {
  weights: {
    name: 10,
    wiki: 2,
  },
  name: 'TextIndex'
});
mongoose.model('Title', TitleSchema);

var GenreSchema = new Schema({
  name: String,
  slug: String
});
GenreSchema.plugin(timestamps);
GenreSchema.index({
  slug: 1
});
mongoose.model('Genre', GenreSchema);

var FileSchema = new Schema({
  path: String,
  slug: String,
  artist: {
    type: ObjectId,
    ref: 'Artist'
  },
  album: {
    type: ObjectId,
    ref: 'Album'
  },
  title: {
    type: ObjectId,
    ref: 'Title'
  },
  genre: {
    type: ObjectId,
    ref: 'Genre'
  },
  file: {
    type: ObjectId,
    ref: 'File'
  }
});
FileSchema.plugin(timestamps);
FileSchema.index({
  slug: 1
});
mongoose.model('File', FileSchema);

var Cache = new Schema({
  key: String,
  data: Schema.Types.Mixed
});
Cache.plugin(timestamps);
Cache.index({
  key: 1
});
mongoose.model('Cache', Cache);

var Artist = mongoose.model('Artist'),
    Album = mongoose.model('Album'),
    Title = mongoose.model('Title'),
    Genre = mongoose.model('Genre'),
    File = mongoose.model('File'),
    Cache = mongoose.model('Cache'),
    Settings = mongoose.model('Settings'),
    models = [Artist, Album, Title, Genre, File];

function listFiles(dirPath, validExtensions) {
  return new Promise(function(resolve, reject) {
    var filePaths = [];

    var walker = walk.walk(dirPath);

    walker.on('file', function (root, fileStats, next) {
      var filePath = root + '/' + fileStats.name, 
          fileExtension = filePath.split('.').pop().toLowerCase();

      if (validExtensions.indexOf(fileExtension) < 0) { next(); return; }

      increaseTodoCounter(2);

      filePaths.push(filePath);

      next();
    });

    walker.on('errors', function(root, nodeStatsArray, next) {
      increaseDoneCounter();
      console.log('file walk error', root, nodeStatsArray);
      next();
    })

    walker.on('end', function() {
      increaseDoneCounter(filePaths.length);
      resolve(filePaths);
    });
  }).catch(function(err) {
    console.log('file walk catch error', dirPath, err);
    return [[], 0];
  });
}

function getFilename(filePath) {
  return filePath.split('/').pop();
}

function getMetdataViaTaglib(filePath) {
  return new Promise(function(resolve, reject) {
    taglib.read(filePath, function(err, tag, audioProperties) {
      if (err) { return reject(err); }

      var metadata = _.extend(tag, audioProperties);

      if (_.isEmpty(metadata) || !metadata.artist || !metadata.title) {
        return resolve(null);
      }

      resolve(metadata);
    });
  }).catch(function(err) {
    console.log('taglib error occured', getFilename(filePath), err);
    return null;
  });
}

function getMetdataViaAcousticId(filePath) {
  return new Promise(function(resolve, reject) {
    acoustid(filePath, {
      key: config.acoustIdKey
    }, function(err, result) {
      setTimeout(function() {
        if (err) { return reject(err); }
        resolve(result);
      }, 1000);
    });
  }).then(function(results) {
    results = _.sortBy(results, function(result) {
      return result.score;
    });

    var recording = results.length && results[0] && results[0].recordings && results[0].recordings.length ? results[0].recordings[0] : null;

    if (!recording) { return; }

    var title = recording.title,
        duration = recording.duration || 0,
        artist = recording.artists && recording.artists.length ? recording.artists[0].name : '',
        album = recording.releasegroups && recording.releasegroups.length ? _.findWhere(recording.releasegroups, {
          type: 'Album'
        }) : '';

    if (album) {
      album = album.title;
    }

    if (!artist || !title) {
      return null;
    }

    return {
      artist: artist,
      title: title,
      duration: duration,
      album: album
    };
  }).catch(function(err) {
    console.log('acousticid error occured', getFilename(filePath), err);
    return null;
  });
}

function getMetadata(filePath) {
  var cacheKey = createHash(filePath);

  return Promise.resolve(getCacheItem(cacheKey) // ensure bluebird chainability
    .then(function(item) {
      if (item) { /*console.log('metadata got cache', getFilename(filePath));*/ return item.data; }

      return getMetdataViaTaglib(filePath)
        .then(function(metadata) {
          if (metadata) { return metadata; }

          console.log('metadata: no taglibdata', getFilename(filePath));

          return getMetdataViaAcousticId(filePath);
        }).then(function(metadata) {
          if (!metadata) { console.log('metadata: no acousticiddata', getFilename(filePath)); return null; }

          return saveCacheItem(cacheKey, metadata)
            .then(function(cache) {
              // console.log('metadata saved cache', getFilename(filePath));
              return cache.data;
            });
        });
    }));
}

function getCacheItem(key) {
  return Cache.findOne({
    key: key
  }).exec();
}

function saveCacheItem(key, data) {
  return Cache.create({
    key: key,
    data: data
  });
}

function createHash(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}

function createInstance(array, key, value, slugValue, Model) {
  value = value || 'N/A';

  slugValue = slugValue.toLowerCase();

  var element = null,
      found = _.findWhere(array, {
        slug: slugValue
      });

  if (found) {
    return found;
  }

  element = new Model();
  element[key] = value;

  array.push(_.extend(element, {
    slug: slugValue
  }));

  increaseTodoCounter();

  return element;
}

function createInstances(filePath, metadata, artists, albums, titles, genres, files) {
  increaseDoneCounter();

  if (_.isEmpty(metadata) || !metadata.artist || !metadata.title) {
    console.log('could not get metadata for %s', filePath);
    return;
  }

  var file = createInstance(files, 'path', filePath, filePath, File),
      artistSlug = slug(metadata.artist) || metadata.artist,
      artist = createInstance(artists, 'name', metadata.artist, artistSlug, Artist),
      hasAlbum = !!metadata.album,
      album = {},
      albumSlug = hasAlbum ? slug(metadata.album) || metadata.album : '',
      title = {},
      preTitleSlug = '',
      titleSlug = '',
      genre = {},
      genreSlug = '';

  if (hasAlbum) {
    titleSlug += ' - ' + albumSlug;
  }

  preTitleSlug = metadata.title.replace(/ü/g, 'ue')
                               .replace(/ä/g, 'ae')
                               .replace(/ö/g, 'oe');

  titleSlug = artistSlug + '-' + (slug(preTitleSlug) || metadata.title);

  title = createInstance(titles, 'name', metadata.title, titleSlug, Title);

  if (metadata.genre) {
    genreSlug = slug(metadata.genre) || metadata.genre;
    genre = createInstance(genres, 'name', metadata.genre, genreSlug, Genre)
  }

  if (metadata.album) {
    album = createInstance(albums, 'name', metadata.album, albumSlug, Album);

    album.artists = album.artists || [];
    if (album.artists.indexOf(artist._id) < 0) {
      album.artists.push(artist._id);
    }

    album.genre = genre._id;
    album.titles = album.titles || [];
    if (album.titles.indexOf(title._id) < 0) {
      album.titles.push(title._id);
    }
  }

  title.duration = metadata.length * 1000;
  title.track = metadata.track || 0;
  title.artist = artist._id;
  title.album = album._id;
  title.genre = genre._id;
  title.file = file._id;

  file.album = album._id;
  file.title = title._id;
  file.artist = artist._id;
  file.genre = genre._id;

  // console.log(title.artist, _.findWhere(artists, {
  //   _id: title.artist
  // }).name);
}

function prepareMetadata(filePaths) {
  var artists = [],
      albums = [],
      titles = [],
      genres = [],
      files = [],
      unknowns = [];

  console.log('prepare metadata (files count: %s)', filePaths.length)

  return Promise.map(filePaths, function(filePath) {
      return getMetadata(filePath)
        .then(function(metadata) {
          increaseDoneCounter();

          if (metadata) {
            createInstances(filePath, metadata, artists, albums, titles, genres, files);
          }
        })
        .catch(function(error) {
          console.log('prepare metadata error', getFilename(filePath), error);
        });
    }, {
      concurrency: config.acoustIdConcurrency
    })
    .then(function() {
      return [files, artists, albums, titles, genres];
    });
}

function getPreparedMetadata() {
  return Promise.reduce(config.folders, function(filePaths, dirPath) {
      return listFiles(dirPath, config.extensions)
        .then(function(paths) {
          return filePaths.concat(paths);
        });
    }, [])
    .then(prepareMetadata);
}

function reduceArraysToArray(arrays) {
  return arrays.reduce(function(result, array) {
    return result.concat(array);
  }, []);
}

function batchSaveDocuments() {
  var arrays = Array.prototype.slice.call(arguments),
      reduced = reduceArraysToArray(arrays);

  console.log('save documents to database (documents count: %s)', reduced.length);

  return Promise.map(reduced, function(metadata) {
    // handle batch save
    return new Promise(function(resolve, reject) {
      metadata.save(function() {
        resolve();
      });
    });
  }, {
    concurrency: config.fileConcurrency
  }).then(function() {
    return arrays;
  });
}

function handleLastFmMetadata(promiseCallback, files, artists, albums, titles, genres) {
  var arrays = Array.prototype.slice.call(arguments),
      reduced = reduceArraysToArray([artists, albums, titles]);

  console.log('handle lastfm requests (request count: %s)', reduced.length);

  // simulate async.series
  Promise.map([
    handleLastFmArtists.bind(null, artists),
    handleLastFmAlbums.bind(null, albums),
    handleLastFmTitles.bind(null, titles)
  ], function(lastFmHandleMethod) {
    return lastFmHandleMethod();
  }, {
    concurrency: 1
  }).then(promiseCallback);

  // ensure chainability
  return Promise.resolve(arrays);
}

function createLastFmRequest(cacheKey, lastFmMethod, requestData, requestKey) {
  return function() {
    return getCacheItem(cacheKey)
      .then(function(cache) {
        if (cache) {
          return Promise.resolve(cache.data);
        }

        return new Promise(function(resolve, reject) {
          lastfm.request(lastFmMethod, _.extend(requestData, {
            autocorrect: 1,
            handlers: {
              success: function(data) {
                saveCacheItem(cacheKey, data[requestKey])
                  .then(function(cache) {
                    setTimeout(resolve.bind(null, cache.data), 1000);
                  });
              },
              error: function(error) {
                console.log('lastfm error occured', error.message, JSON.stringify(requestData));
                setTimeout(resolve.bind(null, null), 1000);
              }
            }
          }));
        })
      });
  }
}

function handleLastFmRequest(methodName, requestData, requestKey, element) {
  var cacheKey = createHash(slug(methodName + element.name)),
      request = null,
      result = {};

  result.element = element;
  result.request = createLastFmRequest(cacheKey, methodName, requestData, requestKey);

  return result.request().then(function(data) {
    increaseDoneCounter();
    return _.extend(result, {
      data: data
    });
  });
}

function transformLastFmImages(images) {
  return images && images.length ? images.reduce(function(imageObject, image) {
    if (image['#text']) {
      imageObject[image.size] = image['#text'];
    }
    return imageObject;
  }, {}) : {}
}

function handleLastFmAlbums(albums) {
  console.log('handle lastfm albums (albums count: %s)', albums.length);

  return Promise.resolve(Album.populate(albums, {
    path: 'artists'
  })).map(function(album) {
      return handleLastFmRequest('album.getInfo', {
        artist: album.artists.length > 1 ? 'Various Artists' : album.artists[0].name,
        album: album.name
      }, 'album', album);
    }, {
      concurrency: config.lastFmConcurrency
    }).then(function(results) {
      var albums = [];

      results.forEach(function(result) {
        var album = result.element,
            data = result.data;

        if (!data) { return; }

        album.name = data.name;
        album.wiki = data.wiki && data.wiki.content ? data.wiki.content.trim() : '';
        album.images = transformLastFmImages(data.image);
        data.releasedate = data.releasedate.trim();
        if (data.releasedate) {
          album.date = moment(data.releasedate, 'D. MMMM YYYY, HH:mm').toDate();
        }

        albums.push(album);
      });

      // console.log('going to save modified albums', albums.length);

      return batchSaveDocuments(albums);
    });
}

function handleLastFmTitles(titles) {
  console.log('handle lastfm titles (titles count: %s)', titles.length);

  return Promise.resolve(Title.populate(titles, {
    path: 'artist'
  })).map(function(title) {
      return handleLastFmRequest('track.getInfo', {
        artist: title.artist.name,
        track: title.name
      }, 'track', title);
    }, {
      concurrency: config.lastFmConcurrency
    })
    .then(function(results) {
      var titles = [];

      results.forEach(function(result) {
        var title = result.element,
            data = result.data;

        if (!data) { return; }

        title.name = data.name;
        title.duration = Number(data.duration) || 0;
        title.wiki = data.wiki && data.wiki.content ? data.wiki.content.trim() : '';

        titles.push(title);
      });

      // console.log('going to save modified titles', titles.length);

      return batchSaveDocuments(titles);
    });
}


function handleLastFmArtists(artists) {
  console.log('handle lastfm artists (artists count: %s)', artists.length);
  return Promise.map(artists, function(artist) {
      return handleLastFmRequest('artist.getInfo', {
        artist: artist.name
      }, 'artist', artist)
    }, {
      concurrency: config.lastFmConcurrency
    })
    .then(function(results) {
      var artists = [];

      results.forEach(function(result) {
        var artist = result.element,
            data = result.data;

        if (!data) { return; }

        artist.name = data.name;
        artist.bio = data.bio && data.bio.content ? data.bio.content.trim() : '';
        artist.images = transformLastFmImages(data.image);

        artists.push(artist);
      });

      // console.log('going to save modified artists', artists.length);

      return batchSaveDocuments(artists);
    });
}


function clearDatabase() {
  return Promise.all(models.map(function(Model) {
    return Model.remove({}).exec();
  })).then(function() {
    console.log('database cleared');
  });
}

function startIndex() {
  status.isIndexing = true;
  status.progress = 0;
  status.todo = 0;
  status.done = 0;

  console.log('starting index process');

  return clearDatabase()
    .then(getPreparedMetadata)
    .spread(batchSaveDocuments)
    .spread(handleLastFmMetadata.bind(null, stopIndex));
}

function increaseTodoCounter(count) {
  status.todo += count || 1;
  calculateProgress();
}

function increaseDoneCounter(count) {
  status.done += count || 1;

  calculateProgress();
}

function calculateProgress() {
  status.progress = status.done / status.todo * 100;
}

function stopIndex() {
  status.progress = 100;
  status.todo = 0;
  status.done = 0;
  status.isIndexing = false;
  console.log('index process done');
}

function handleSimpleGet(Model, req, res, modifyFunction) {
  var functionName = req.params.slug ? 'findOne' : 'find',
      functionParams = req.params.slug ? {
        slug: req.params.slug
      } : {};

  Model[functionName](functionParams)
    .limit(req.query.limit)
    .skip(req.query.skip)
    .sort({
      track: 1,
      name: 1
    })
    .exec()
    .then(_.isFunction(modifyFunction) ? modifyFunction : function(result) {
      return result;
    })
    .then(function(result) {
      return Model[functionName](functionParams).count().exec()
        .then(function(count) {
          return {
            total: count,
            limit: req.query.limit,
            skip: req.query.skip,
            data: result
          }
        });
    })
    .then(function(result) {
      res.json(result);
    });
}

function handleAdvancedGet(Model, models, modifyFunction) {
  var mainModelName = Model.modelName.toLowerCase();

  models.forEach(function(TargetModel) {
    var modelName = TargetModel.modelName.toLowerCase(),
        queryParam = {};
    
    app.get(config.apiPrefix + '/' + mainModelName + 's/:slug/' + modelName + 's', function(req, res) {
      Model.findOne({
        slug: req.params.slug
      }).exec()
        .then(function(element) {
          var isArray = !!TargetModel.schema.paths[mainModelName + 's'];

          if (isArray) {
            queryParam[mainModelName + 's'] = {
              $in: [element._id]
            };
          } else {
            queryParam[mainModelName] = element._id;
          }

          return TargetModel.find(queryParam).limit(req.query.limit)
            .skip(req.query.skip)
            .sort({
              track: 1,
              name: 1
            })
            .exec();
        })
        .then(function(result) {
          return TargetModel.populate(result, {
            path: 'artist artists genre album titles'
          })
        })
        .then(function(result) {
          return TargetModel.find(queryParam).count().exec()
            .then(function(count) {
              return {
                total: count,
                limit: req.query.limit,
                skip: req.query.skip,
                data: result
              }
            });
        })
        .then(function(result) {
          return _.isFunction(modifyFunction) ? modifyFunction(result) : result;
        })
        .then(function(result) {
          res.json(result);
        });
    })
  });
}

function findRandomTitle(titlesCount) {
  var random = _.random(0, titlesCount);

  return Title.findOne({}).skip(random).exec();
}

function handleSearch(Model, query) {
  return Model.find({
    $text: { $search: query }
  }, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } }).exec()
    .then(function(elements) {
      return Model.populate(elements, {
        path: 'artist artists titles genre'
      });
    });
}

function updateConfig(settings) {
  _.extend(config, settings.toObject());

  if (config.lastFmKey && config.lastFmSecret && config.lastFmUseragent) {
    lastfm = new LastFmNode({
      api_key: config.lastFmKey,
      secret: config.lastFmSecret,
      useragent: config.lastFmUseragent
    });
  }
}

var app = express(),
    defaultDbName = 'spotinode',
    config = {
      dbName: defaultDbName
    },
    status = {
      isIndexing: false,
      todo: 0,
      done: 0,
      progress: 0
    };

app.use(morgan('dev', {
  skip: function (req, res) {
    return !req.url.match(/^\/api/) || req.url.match(/^\/api\/(placeholder|status)/);
  }
})); // logging
app.use(compression());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({  // for parsing application/x-www-form-urlencoded
  extended: true
}));
app.use(multer()); // for parsing multipart/form-data

app.use(express.static(__dirname + '/../client/app'));

// ensure pagination params
app.use(function(req, res, next) {
  req.query.limit = parseInt(req.query.limit || config.requestLimit, 10);
  req.query.skip = parseInt(req.query.skip || 0, 10);
  next();
});

mongoose.connect('mongodb://localhost/' + config.dbName || defaultDbName);

Settings.findOne({}).exec()
  .then(function(settings) {
    if (settings) { return settings; }

    return Settings.create({
      extensions: ['mp3', 'mpeg', 'ogg', 'flac', 'mpc', 'wv', 'spx', 'tta', 'mp4', 'asf', 'aiff', 'wav', 'ape', 'mod', 's3m', 'it', 'xm'],
      apiPrefix: '/api',
      dbName: defaultDbName,
      requestLimit: 50,
      fileConcurrency: 25,
      acoustIdConcurrency: 3,
      lastFmUseragent: 'spotinode',
      lastFmConcurrency: 5
    });
  }).then(updateConfig)
    .then(initApp);

function initApp() {

  app.get(config.apiPrefix + '/artists/:slug?', function(req, res) {
    handleSimpleGet(Artist, req, res);
  });

  handleAdvancedGet(Artist, [Title, Album], function(result) {
    var albums = result.data;

    if (!albums.length || !albums[0].titles) { return result; }

    return Promise.map(albums, function(album) {
      return Promise.map(album.titles, function(title) {
        return Title.populate(title, {
          path: 'artist'
        });
      }).then(function(titles) {
        album.titles = titles;
        return album;
      });
    }).then(function(albums) {
      return _.extend(result, {
        data: albums
      });
    });
  });

  app.get(config.apiPrefix + '/genres/:slug?', function(req, res) {
    handleSimpleGet(Genre, req, res);
  });

  handleAdvancedGet(Genre, [Album, Title]);

  app.get(config.apiPrefix + '/albums/:slug?', function(req, res) {
    handleSimpleGet(Album, req, res, function(albums) {
      return Album.populate(albums, {
        path: 'titles artists genre'
      });
    });
  });

  handleAdvancedGet(Album, [Title]);

  app.get(config.apiPrefix + '/titles/:slug?', function(req, res) {
    handleSimpleGet(Title, req, res, function(titles) {
      return Title.populate(titles, {
        path: 'artist genre album'
      });
    });
  });

  handleAdvancedGet(Title, [Artist, Album, Genre]);

  app.get(config.apiPrefix + '/title/:slug', function(req, res) {
    Title.findOne({
      slug: req.params.slug
    }).exec()
      .then(function(title) {
        return Title.populate(title, {
          path: 'file'
        });
      })
      .then(function(title) {
        console.log(title.file.path)
        res.sendFile(title.file.path);
      });
  })

  app.get(config.apiPrefix + '/index', function(req, res) {
    if (status.isIndexing) {
      return res.json(status);
    }

    startIndex();

    res.json(status);
  });

  app.get(config.apiPrefix + '/status', function(req, res) {
    res.json(status);
  });

  app.get(config.apiPrefix + '/placeholder', function(req, res) {
    var text = req.query.text || '',
        width = 500,
        height = 500,
        canvas = new Canvas(width, height),
        ctx = canvas.getContext('2d'),
        measured = null;

    ctx.font = '30px sans-serif';

    ctx.fillStyle = '#666';
    ctx.fillRect(0, 0, width, height);

    measured = ctx.measureText(text);

    ctx.fillStyle = '#FFF';
    ctx.fillText(text, width / 2 - measured.width / 2, height / 2 - 15);

    var buffer = canvas.toBuffer();

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length
    });
    res.send(buffer);

  });




  app.get(config.apiPrefix + '/random', function(req, res) {

    var randomCount = Number(req.query.count) || 50,
        array = new Array(randomCount).join('.').split('.');

    Title.find({})
      .count().exec()
      .then(function(count) {
        array = array.map(function() {
          return findRandomTitle(count);
        });

        return Promise.all(array);
      }).then(function(titles) {
        return Title.populate(titles, {
          path: 'artist album'
        });
      }).then(function(titles) {
        res.json(titles);
      });
  });



  app.get(config.apiPrefix + '/search', function(req, res) {
    var query = req.query.query,
        result = {};

    Promise.all([
      handleSearch(Album, query),
      handleSearch(Artist, query),
      handleSearch(Title, query)
    ]).spread(function(albums, artists, titles) {
      res.json({
        albums: albums,
        artists: artists,
        titles: titles
      })
    });
  });

  app.get('/settings', function(req, res) {
    res.json({
      folders: config.folders,
      apiPrefix: config.apiPrefix,
      requestLimit: config.requestLimit,
      lastFmKey: config.lastFmKey,
      lastFmSecret: config.lastFmSecret,
      acoustIdKey: config.acoustIdKey
    });
  });

  app.post('/settings', function(req, res) {
    console.log(req.body);
    _.extend(config, req.body)
    res.json({
      folders: config.folders,
      apiPrefix: config.apiPrefix,
      requestLimit: config.requestLimit,
      lastFmKey: config.lastFmKey,
      lastFmSecret: config.lastFmSecret,
      acoustIdKey: config.acoustIdKey
    });
  });

  app.listen(3000);
}

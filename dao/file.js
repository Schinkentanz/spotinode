var fs = require('fs'),
	ID3 = require('id3'),
	async = require('async')

var FileDAO = function(settings, mongo, utils) {
	this.indexing = false;
	this.get = function(path, callback) {
		mongo.files.find({
			parent: path
		}, function(error, files) {
			callback.call(null, error, files);
		});
	};
	this.save = function(file) {
		mongo.files.update({
			_id: file._id
		}, file, {
			upsert: true
		}, function(err) {
			//todo // callback?
		});
	};
	this.status = function(callback) {
		callback.call(null, this.indexing);
	};
	this.start = function(path, callback) {
		if (!this.indexing) {
			this.indexing = true;
			(function(dao, path) {
				process.nextTick(function () {
					dao.index(dao, path, true);
				});
			})(this, path);
			callback.call(null, true, true);
		} else {
			callback.call(null, false, true);
		}
	};
	this.remove = function(obj) {
		if (typeof(obj) === 'boolean' && obj) { //all
			mongo.files.remove();
		} else {
			
		}
	};
	this.index = function(dao, path, start, cb) {
		if (start) {
			dao.remove(true);
		}
		async.waterfall([
			function(callback) {
				fs.readdir(path, function(error, files) {
					callback(null, error, files);
				});
			},
			function(error, files, callback) {
				if (!error && files.length > 0) {
					var _files = [];
					for (var file in files) {
						_files.push({
							path: path + '/' + files[file],
							file: files[file],
							parent: path
						});
					}
					async.map(_files, function(file, callback) {
						fs.stat(file.path, function(err, stat) {
							callback(err, {
								path: file.path,
								file: file.file,
								parent: file.parent,
								stat: stat
							});
						});
					}, function(err, results) {
						callback(null, err, results);
					});
				}
			},
			function(error, files, callback) {
				if (!error && files.length > 0) {
					async.map(files, function(file, callback) {
						if (file.stat.isFile()) {
							var name = file.file.substring(0, file.file.lastIndexOf('.'));
							var type = file.file.substring(file.file.lastIndexOf('.') + 1, file.file.length).toUpperCase();
							if (settings.dao.file.valid[type]) {
								if (settings.dao.file.valid[type] === settings.dao.file.valid.MP3) {
									fs.readFile(file.path, function(err, buffer) {
										var meta = null;
										if (!err) {
											var id3 = new ID3(buffer);
											id3.parse();
											meta = {
												title: id3.get('title'),
												artist: id3.get('artist'),
												album: id3.get('album'),
												year: id3.get('year'),
												comment: id3.get('comment'),
												track: id3.get('track')
											};
											// meta.lyrics = id3.get('lyrics');
											// meta.picture = id3.get('picture');
										}
										console.log('waterfall 3 (file)', file.path);
										callback(err, {
											path: file.path,
											file: file.file,
											parent: file.parent,
											stat: file.stat,
											meta: meta,
											name: name,
											type: type,
											_type: settings.dao.file.types.FILE
										});
									});
								} else {
									callback(err, {
										path: file.path,
										file: file.file,
										parent: file.parent,
										stat: file.stat,
										meta: null,
										name: name,
										type: type,
										_type: settings.dao.file.types.FILE
									});
								}
							}
						} else if (file.stat.isDirectory()) {
							callback(null, {
								path: file.path,
								file: file.file,
								parent: file.parent,
								stat: file.stat,
								_type: settings.dao.file.types.FOLDER
							});
						}
					}, function(err, results) {
						callback(null, err, results);
					});
				}
			},
			function(error, files, callback) {
				if (!error && files.length > 0) {
					async.map(files, function(file, callback) {
						var _cb = function() {
							callback(null, true);
						};
						if (file._type === settings.dao.file.types.FILE) {
							dao.save({
								name: file.name,
								type: file.type,
								_type: file._type,
								size: file.stat.size,
								time: file.stat.mtime.getTime(),
								path: file.path,
								meta: file.meta,
								parent: file.parent
							});
							_cb();
						} else if (file._type === settings.dao.file.types.FOLDER) {
							dao.save({
								file: file.file,
								_type: file._type,
								path: file.path,
								time: file.stat.mtime.getTime(),
								stat: file.stat,
								parent: file.parent
							});
							dao.index(dao, file.path, false, _cb)
						}
					}, function(err, results) {
						callback(null, results);
					});
				}
			}
		], function(error, results) {
			if (start) {
				dao.stop();
			}
			if (typeof(cb) === 'function') {
				cb();
			}
		});
	};
	this.stop = function() {
		this.indexing = false;
	};
};

module.exports = FileDAO;

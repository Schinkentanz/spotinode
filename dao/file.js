var fs = require('fs'),
	ID3 = require('id3');

var FileDAO = function(settings, mongo, utils) {
	this.stat = {
		indexing: false,
		counted: 0,
		counter: 0
	};
	this.get = function(query, callback) {
		mongo.files.find(query).sort({
			name: 1,
			path: 1
		}, function(error, files) {
			callback.call(null, error, files);
		});
	};
	this.save = function(file, callback) {
		mongo.files.update({
			_id: file._id
		}, file, {
			upsert: true
		}, function(error, state, data) {
			callback.call(null, error, data);
		});
	};
	this.status = function(callback) {
		callback.call(null, {
			indexing: this.stat.indexing,
			percentage: this.stat.counter / this.stat.counted * 100
		});
	};
	this.start = function(path, callback) {
		if (!this.stat.indexing) {
			this.stat.indexing = true;
			this.stat.counted = this.stat.counter = 0;
			this.remove(true);
			this.count(this, path, function(dao, counted) {
				dao.stat.counted = counted;
				fs.stat(path, function(error, stat) {
					if (!error && stat.isDirectory()) {
						dao.index(dao, {
							_type: settings.dao.file.types.FOLDER,
							path: path,
							parent: null,
							name: path.substring(path.lastIndexOf('/') + 1, path.length),
							time: stat.mtime.getTime()
						}, function(error, data) {
							if (!error && data.upserted) {
								dao.walk(dao, path, data.upserted, function(dao) {
									dao.stop();
								});
							} else {
								dao.stop(); //save error
							}
						});
					} else {
						dao.stop(); //save error
					}
				});
			});
			callback.call(null, true, true); //success, indexing
		} else {
			callback.call(null, false, true);
		}
	};
	this.remove = function(obj) {
		if (typeof(obj) === 'boolean' && obj) { //all
			mongo.files.remove();
		} else if (typeof(obj) === 'string') {
			mongo[obj].remove();
		} else {
			
		}
	};
	this.count = function(dao, path, callback) {
		var counted = 0;
		fs.readdir(path, function(error, files) {
			var i = 0;
			(function next() {
				var file = files[i++];
				if (!file) {
					if (i < files.length) {
						next();
					} else {
						return callback.call(null, dao, counted);
					}
				}
				file = path + '/' + file;
				fs.stat(file, function(error, stat) {
					counted++;
					if (stat && stat.isDirectory()) {
						dao.count(dao, file, function(dao, _counted) {
							counted += _counted;
							next();
						});
					} else {
						next();
					}
				}); 
			})();
		});
	};
	this.walk = function(dao, path, parent, callback) {
		fs.readdir(path, function(error, files) {
			var i = 0;
			(function next() {
				var file = files[i++];
				if (!file) {
					if (i < files.length) {
						next();
					} else {
						return callback.call(null, dao);
					}
				}
				var _path = path + '/' + file;
				fs.stat(_path, function(error, stat) {
					if (!error && stat) {
						if (stat.isDirectory()) {
							dao.index(dao, {
								_type: settings.dao.file.types.FOLDER,
								path: _path,
								parent: parent,
								name: file,
								time: stat.mtime.getTime()
							}, function(error, data) {
								if (!error && data.upserted) {
									dao.walk(dao, _path, data.upserted, function() {
										next();
									});
								} else {
									next();
								}
							});
						} else if (stat.isFile()) {
							dao.index(dao, {
								_type: settings.dao.file.types.FILE,
								path: _path,
								parent: parent,
								name: file,
								time: stat.mtime.getTime(),
								size: stat.size,
								type: file.substring(file.lastIndexOf('.') + 1, file.length).toUpperCase()
							}, function(error, data) {
								next();
								/*if (!error && data.upserted) {
									next();
								} else {
									next();
								}*/
							});
						} else {
							next();
						}
					} else {
						next();
					}
				});
			})();
		});
	};
	this.index = function(dao, data, callback) {
		if (data._type === settings.dao.file.types.FOLDER) {
			dao.save(data, function(error, data) {
				dao.stat.counter++;
				callback.call(null, error, data);
			});
		} else if (data._type === settings.dao.file.types.FILE) {
			if (settings.dao.file.valid[data.type]) {
				if (settings.dao.file.valid[data.type] === settings.dao.file.valid.MP3) {
					fs.readFile(data.path, function(error, buffer) {
						if (!error) {
							var id3 = new ID3(buffer);
							id3.parse();
							data.meta = {
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
						dao.save(data, function(error, data) {
							dao.stat.counter++;
							callback.call(null, error, data);
						});
					});
				} else {
					dao.save(data, function(error, data) {
						dao.stat.counter++;
						callback.call(null, error, data);
					});
				}
			} else {
				callback.call(null, null, {});
			}
		}
	};
	this.stop = function() {
		this.stat.indexing = false;
	};
};

module.exports = FileDAO;

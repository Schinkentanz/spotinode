var fs = require('fs'),
	ID3 = require('id3'),
	async = require('async')

var FileDAO = function(settings, mongo, utils) {
	this.indexing = false;
	this.get = function(path, callback) {
		mongo.files.find({
			parent: path
		}).sort({
			name: 1,
			path: 1
		}, function(error, files) {
			callback.call(null, error, files);
		});
	};
	this.search = function(search, callback) {
		var rxp = new RegExp('.*' + search + '.*', 'i');
		mongo.files.find({
			// name: rxp,
			path: rxp
		}).sort({
			// name: 1,
			path: 1
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
			this.walk(this, path, function(dao, files) {
				dao.remove(true);
				dao.index(dao, files, function(dao) {
					dao.stop();
				});
			});
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
	this.walk = function(dao, path, callback) {
		var result = [];
		fs.readdir(path, function(err, files) {
			var i = 0;
			(function next() {
				var file = files[i++];
				if (!file)
					return callback.call(null, dao, result);
				var _path = path + '/' + file; 
				fs.stat(_path, function(err, stat) {
					if (stat) {
						result.push({
							path: _path,
							file: file,
							parent: path,
							stat: stat
						});
						if (stat.isDirectory()) {
							dao.walk(dao, _path, function(err, _result) {
								result = result.concat(_result);
								next();
							});
						} else {
							next();
						}
					}
				});
			})();
		});
	};
	this.index = function(dao, files, callback) {
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
							dao.save({
								_type: settings.dao.file.types.FILE,
								name: name,
								type: type,
								meta: meta,
								size: file.stat.size,
								time: file.stat.mtime.getTime(),
								path: file.path,
								parent: file.parent
							});
							next();
						});
					} else {
						dao.save({
							_type: settings.dao.file.types.FILE,
							name: name,
							type: type,
							meta: null,
							size: file.stat.size,
							time: file.stat.mtime.getTime(),
							path: file.path,
							parent: file.parent
						});
						next();
					}
				} else {
					next();
				}
			} else if (file.stat.isDirectory()) {
				dao.save({
					_type: settings.dao.file.types.FOLDER,
					path: file.path,
					file: file.file,
					parent: file.parent,
					time: file.stat.mtime.getTime()
				});
				next();
			}
		})();
	};
	this.stop = function() {
		this.indexing = false;
	};
};

module.exports = FileDAO;

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
	
/*	async.series([
    function(callback){
        // do some stuff ...
        callback(null, 'one');
    },
    function(callback){
        // do some more stuff ...
        callback(null, 'two');
    },
],
// optional callback
function(err, results){
    // results is now equal to ['one', 'two']
});*/
	
	
	this.index = function(dao, path, start, cb) {
		if (start) {
			dao.remove(true);
		}
		async.waterfall([
			function(callback) {
				console.log('waterfall 1');
				fs.readdir(path, function(error, files) {
					callback(null, error, files);
				});
			},
			function(error, files, callback) {
				console.log('waterfall 2', files.length);
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
				console.log('waterfall 3', files.length);
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
									console.log('waterfall 3 (file)', file.path);
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
							console.log('waterfall 3 (folder)', file.path);
						}
					}, function(err, results) {
						callback(null, err, results);
					});
				}
			},
			function(error, files, callback) {
				console.log('waterfall 4', files.length);
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
								name: file.name,
								type: file.type,
								_type: file._type,
								size: file.stat.size,
								time: file.stat.mtime.getTime(),
								path: file.path,
								meta: file.meta,
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
			console.log('waterfall finished', results.length);
			if (start) {
				dao.stop();
			}
			if (typeof(cb) === 'function') {
				cb();
			}
		}); 
		
		
		
		
		
		
		// async.series([
			// function(callback) {
				// fs.readdir(path, function(error, files) {
					// callback(null, {
						// error: error,
						// files: files
					// });
				// });
			// }
		// ], function(error, result) {
			// if (!error && result.length > 0 && !result[0].error) {
				// var series = [];
				// for (var file in result[0].files) {
					// file = result[0].files[file];
					// var _path = path + '/' + file;
					// console.log(_path);
					// (function(_path, file) {
						// series.push(function(callback) {
							// fs.stat(_path, function(error, stat) {
								// if (!error && stat.isFile()) {
									// var _save = function(name, type, size, time, path, meta, parent) {
										// dao.save({
											// name: name,
											// type: type,
											// _type: settings.dao.file.types.FILE,
											// size: size,
											// time: time,
											// path: path,
											// meta: meta ? meta : null,
											// parent: parent
										// });
										// callback(null, true);
									// }
									// var meta = {};
									// var name = file.substring(0, file.lastIndexOf('.'));
									// var type = file.substring(file.lastIndexOf('.') + 1, file.length).toUpperCase();
									// if (settings.dao.file.valid[type]) {
										// if (settings.dao.file.valid[type] === settings.dao.file.valid.MP3) {
											// (function(name, type, stat, meta) {
												// // process.nextTick(function() {
												// fs.readFile(_path, function(error, buffer) {
													// if (!error) {
														// var id3 = new ID3(buffer);
														// id3.parse();
														// meta.title = id3.get('title');
														// meta.artist = id3.get('artist');
														// meta.album = id3.get('album');
														// meta.year = id3.get('year');
														// meta.comment = id3.get('comment');
														// meta.track = id3.get('track');
														// // meta.lyrics = id3.get('lyrics');
														// // meta.picture = id3.get('picture');
													// }
													// _save(name, type, stat.size, stat.mtime.getTime(), _path, meta, path);
												// });
												// // });
											// })(name, type, stat, meta);
										// }
									// } else {
										// _save(name, type, stat.size, stat.mtime.getTime(), _path, meta, path);
									// }
								// } else if (recursive && stat.isDirectory()) {
									// dao.save({
										// name: _path,
										// _type: settings.dao.file.types.FOLDER,
										// time: stat.mtime.getTime(),
										// path: _path,
										// parent: path
									// });
									// process.nextTick(function() {
										// dao.index(dao, _path, true, false);
									// });
								// }
// 								
// 								
								// /*callback(null, {
									// error: error,
									// stat: stat,
									// _path: _path
								// });*/
							// });
						// });
					// })(_path, file);
				// }
				// async.series(series, function(error, result) {
					// console.log('asdasdasdasd');
				// });
// 					
					// /*
					// (function(file, _path) {
						// process.nextTick(function() {
						// fs.stat(_path, function(error, stat) {
							// if (!error && stat.isFile()) {
								// var _save = function(name, type, size, time, path, meta, parent) {
									// dao.save({
										// name: name,
										// type: type,
										// _type: settings.dao.file.types.FILE,
										// size: size,
										// time: time,
										// path: path,
										// meta: meta ? meta : null,
										// parent: parent
									// });
								// }
								// var meta = {};
								// var name = file.substring(0, file.lastIndexOf('.'));
								// var type = file.substring(file.lastIndexOf('.') + 1, file.length).toUpperCase();
								// if (settings.dao.file.valid[type]) {
									// if (settings.dao.file.valid[type] === settings.dao.file.valid.MP3) {
										// (function(name, type, stat, meta) {
											// process.nextTick(function() {
											// fs.readFile(_path, function(error, buffer) {
												// if (!error) {
													// var id3 = new ID3(buffer);
													// id3.parse();
													// meta.title = id3.get('title');
													// meta.artist = id3.get('artist');
													// meta.album = id3.get('album');
													// meta.year = id3.get('year');
													// meta.comment = id3.get('comment');
													// meta.track = id3.get('track');
													// // meta.lyrics = id3.get('lyrics');
													// // meta.picture = id3.get('picture');
												// }
												// _save(name, type, stat.size, stat.mtime.getTime(), _path, meta, path);
											// });
											// });
										// })(name, type, stat, meta);
									// }
								// } else {
									// _save(name, type, stat.size, stat.mtime.getTime(), _path, meta, path);
								// }
							// } else if (recursive && stat.isDirectory()) {
								// dao.save({
									// name: _path,
									// _type: settings.dao.file.types.FOLDER,
									// time: stat.mtime.getTime(),
									// path: _path,
									// parent: path
								// });
								// dao.index(dao, _path, true, false);
							// }
						// });
						// });
					// })(file, _path);
				// }*/
			// }
		// });

		
		
		
		
		
		
		
		/*process.nextTick(function() {
		fs.readdir(path, function(error, files) {
			if (!error) {
				for (var file in files) {
					file = files[file];
					var _path = path + '/' + file;
					(function(file, _path) {
						process.nextTick(function() {
						fs.stat(_path, function(error, stat) {
							if (!error && stat.isFile()) {
								var _save = function(name, type, size, time, path, meta, parent) {
									dao.save({
										name: name,
										type: type,
										_type: settings.dao.file.types.FILE,
										size: size,
										time: time,
										path: path,
										meta: meta ? meta : null,
										parent: parent
									});
								}
								var meta = {};
								var name = file.substring(0, file.lastIndexOf('.'));
								var type = file.substring(file.lastIndexOf('.') + 1, file.length).toUpperCase();
								if (settings.dao.file.valid[type]) {
									if (settings.dao.file.valid[type] === settings.dao.file.valid.MP3) {
										(function(name, type, stat, meta) {
											process.nextTick(function() {
											fs.readFile(_path, function(error, buffer) {
												if (!error) {
													var id3 = new ID3(buffer);
													id3.parse();
													meta.title = id3.get('title');
													meta.artist = id3.get('artist');
													meta.album = id3.get('album');
													meta.year = id3.get('year');
													meta.comment = id3.get('comment');
													meta.track = id3.get('track');
													// meta.lyrics = id3.get('lyrics');
													// meta.picture = id3.get('picture');
												}
												_save(name, type, stat.size, stat.mtime.getTime(), _path, meta, path);
											});
											});
										})(name, type, stat, meta);
									}
								} else {
									_save(name, type, stat.size, stat.mtime.getTime(), _path, meta, path);
								}
							} else if (recursive && stat.isDirectory()) {
								dao.save({
									name: _path,
									_type: settings.dao.file.types.FOLDER,
									time: stat.mtime.getTime(),
									path: _path,
									parent: path
								});
								dao.index(dao, _path, true, false);
							}
						});
						});
					})(file, _path);
				}
			}
		});
		});*/
		/*
		var files = fs.readdirSync(path);
		for (var file in files) {
			file = files[file];
			var _path = path + '/' + file;
			var stat = fs.statSync(_path);
			if (stat.isFile()) {
				var meta = {};
				var name = file.substring(0, file.lastIndexOf('.'));
				var type = file.substring(file.lastIndexOf('.') + 1, file.length).toUpperCase();
				if (settings.dao.file.valid[type]) {
					if (settings.dao.file.valid[type] === settings.dao.file.valid.MP3) {
						var buffer = fs.readFileSync(_path);
						var id3 = new ID3(buffer);
						id3.parse();
						meta.title = id3.get('title');
						meta.artist = id3.get('artist');
						meta.album = id3.get('album');
						meta.year = id3.get('year');
						meta.comment = id3.get('comment');
						meta.track = id3.get('track');
						// meta.lyrics = id3.get('lyrics');
						// meta.picture = id3.get('picture');
					}
				}
				dao.save({
					name: name,
					type: type,
					_type: settings.dao.file.types.FILE,
					size: stat.size,
					time: stat.mtime.getTime(),
					path: _path,
					meta: meta,
					parent: path
				});
			} else if (recursive && stat.isDirectory()) {
				dao.save({
					name: _path,
					_type: settings.dao.file.types.FOLDER,
					time: stat.mtime.getTime(),
					path: _path,
					parent: path
				});
				dao.index(dao, _path, true, false);
			}
		}*/
		/*if (start) {
			dao.stop();
		}*/
	};
	this.stop = function() {
		this.indexing = false;
	};
};

module.exports = FileDAO;

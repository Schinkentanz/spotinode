String.prototype.startsWith = function(str) { return (this.match('^' + str) == str) };

var FileManager = function(settings, dao, cache, utils) {
	this.get = function(path, _cache, callback) {
		var _callback = null;
		var _path = settings.manager.file.ROOT_PATH;
		if (typeof(path) !== 'undefined' && path.startsWith(settings.manager.file.ROOT_PATH) && path.indexOf('..') === -1) {
			_path = path;
		}
		var key = utils.hashCode(settings.manager.file.CACHE_KEY + _path);
		var files = cache.get(key);
		if (files === null || (typeof(!_cache) !== 'undefined' && !_cache)) {
			dao.file.get(_path, function(error, files) {
				cache.set(key, files);
				callback.call(null, error, files);
			});
		} else {
			callback.call(null, false, files);
		}
	};
	this.index = function(callback) {
		dao.file.start(settings.manager.file.ROOT_PATH, callback);
	};
	this.status = function(callback) {
		dao.file.status(callback);
	};
};

module.exports = FileManager;
var StreamManager = function(settings, dao, cache, utils) {
	this.action = function(path, callback) {
		var _path = settings.manager.file.ROOT_PATH;
		if (utils.isPathValid(path, settings.manager.file.ROOT_PATH)) {
			_path = path;
		}
		dao.stream.action(path, callback);
	};
};

module.exports = StreamManager;
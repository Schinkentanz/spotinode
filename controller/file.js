var FileController = function(settings, resource, app, manager, utils) {
	var prepare = function(req, res, next) {
		utils.prepareJSON(res);
		next();
	};
	
	app.get('/files', prepare, function(req, res) {
		manager.file.get(req.query.path, req.query.cache, function(error, files) {
			res.send(JSON.stringify(files));
		});
	});
	app.get('/files/index', prepare, function(req, res) {
		manager.file.index(function(success, indexing) {
			res.send(JSON.stringify({
				success: success,
				indexing: indexing
			}));
		});
	});
	app.get('/files/status', prepare, function(req, res) {
		manager.file.status(function(indexing) {
			res.send(JSON.stringify({
				indexing: indexing
			}));
		});
	});
};

module.exports = FileController;

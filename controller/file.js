var FileController = function(settings, resource, app, manager, utils) {
	
	var render = function(error, files, req, res, view) {
		var folders = [];
		var _files = [];
		
		for (var file in files) {
			if (files[file]._type === settings.dao.file.types.FILE) {
				_files.push(files[file]);
			} else if (files[file]._type === settings.dao.file.types.FOLDER) {
				folders.push(files[file]);
			}
		}
		
		res.render(view, {
			files: _files.length > 0 ? _files : null,
			folders: folders.length > 0 ? folders : null
		});
	};
	
	app.get('/search', function(req, res) {
		manager.file.search(req.query.search, req.query.cache, function(error, files) {
			render(error, files, req, res, 'file');
		});
	});
	app.get('/files', function(req, res) {
		manager.file.get(req.query.path, req.query.cache, function(error, files) {
			render(error, files, req, res, 'file');
		});
	});
	
	
	var prepare = function(req, res, next) {
		utils.prepareJSON(res);
		next();
	};
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

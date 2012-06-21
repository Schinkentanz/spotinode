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
	
	
	app.get('/files/index', function(req, res) {
		utils.prepareJSON(res);
		manager.file.index(function(success, indexing) {
			res.send(JSON.stringify({
				success: success,
				indexing: indexing
			}));
		});
	});
	app.get('/files/status', function(req, res) {
		utils.prepareJSON(res);
		manager.file.status(function(status) {
			res.send(JSON.stringify(status));
		});
	});
};

module.exports = FileController;

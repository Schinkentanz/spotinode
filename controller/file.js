var FileController = function(settings, resource, app, manager, utils) {
	var prepare = function(req, res, next) {
		utils.prepareJSON(res);
		next();
	};
	
	app.get('/files', function(req, res) {
		manager.file.get(req.query.path, req.query.cache, function(error, files) {
			
			var folders = [];
			var _files = [];
			
			for (var file in files[0]) {
				if (files[file]._type === settings.dao.file.types.FILE) {
					_files.push(files[file]);
				} else if (files[file]._type === settings.dao.file.types.FOLDER) {
					files[file].file = files[file].path.substring(files[file].path.lastIndexOf('/') + 1, files[file].path.length);
					folders.push(files[file]);
				}
			}
			
			res.render('files', {
				files: files.length > 0 ? files : null,
				folders: folders.length > 0 ? folders : null
			});
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

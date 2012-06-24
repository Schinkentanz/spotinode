var FileController = function(settings, resource, app, manager, utils) {
	var render = function(req, res, files, parent, view) {
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
			folders: folders.length > 0 ? folders : null,
			noLayout: true,
			utils: utils,
			parent: parent ? utils.idToString(parent) : null
		});
	};
	
	app.get('/files', function(req, res) {
		manager.file.get({
			folder: req.query.folder
		}, req.query.cache, function(error, files, parent) {
			render(req, res, files, parent, 'file');
		});
	});
	
	app.get('/search', function(req, res) {
		manager.file.search({
			search: req.query.search
		}, req.query.cache, function(error, files, parent) {
			render(req, res, files, parent, 'file');
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

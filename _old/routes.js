var fs = require('fs'),
	settings = require(__dirname + '/../settings.js').settings,
	resource = require(__dirname + '/../resource.js').resource;


var FileManager = function() {
	this.query = function(path, recursive, index) {
		index = index || 0;
		var files = {}, _files = fs.readdirSync(path);
		for (var f in _files) {
			var p = path + '/' + _files[f];
			var stat = fs.statSync(p);
			if (stat.isFile()) {
				files[index++] = p;
			} else if (recursive && stat.isDirectory()) {
				files[index++] = this.query(p, recursive, index);
			}
		}
		return files;
	};
};
var fileManager = new FileManager();





module.exports = function(app) {
	app.get('/', function(req, res) {
		res.render('index', {
			title: resource.index.title
		})
	});
	app.get('/files', function(req, res) {
		res.render('files', {
			title: resource.files.title,
			data: JSON.stringify(fileManager.query(settings.MUSIC_PATH, true))
		})
	});
}; 


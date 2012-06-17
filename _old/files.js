var resource = require('../resource.js').resource.files,
	settings = require('../settings.js').settings,
	fs = require('fs');


var FileManager = function() {
	this.query = function(path, recursive, files, counter) {
		counter = counter || 0;
		files = files || {};
		var _files = fs.readdirSync(path);
		for (var f in _files) {
			var stat = fs.fstatSync(f);
			if (stat.isFile()) {
				files[counter] = f;
			} else if (recursive && stat.isDirectory()) {
				files[counter] = {};
				this.query(f, true, files[counter], counter);
			}
		}
	};
};


var fileManager = new FileManager();

exports.files = function(req, res) {
	var d = fileManager.query(settings.MUSIC_PATH, true);
	console.log(d);
	res.render('files', {
		data: JSON.stringify(d)
	})
}; 
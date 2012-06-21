var fs = require('fs');

var StreamDAO = function(settings, mongo, utils) {
	this.action = function(path, callback) {
		var stat = fs.stat(path, function(error, stat) {
			if (stat.isFile()) {
				var stream = fs.createReadStream(path);
				callback.call(null, stream, stat);
			}
		});
	};
	
};

module.exports = StreamDAO;

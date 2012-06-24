var fs = require('fs');

var StreamDAO = function(settings, mongo, utils) {
	this.get = function(query, callback) {
		mongo.files.find(query, function(error, files) {
			callback.call(null, error, files);
		});
	};
	this.action = function(id, callback) {
		this.get({
			_id: id
		}, function(error, files) {
			if (!error && files.length > 0) {
				var stream = fs.createReadStream(files[0].path);
				stream.on('open', function() {
					callback.call(null, stream, files[0]);
				});
			} else {
				callback.call(null, null, null)
			}
		});
	};
};

module.exports = StreamDAO;

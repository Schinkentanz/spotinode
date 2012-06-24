var util = require('util');

var StreamController = function(settings, resource, app, manager) {
	app.get('/stream.mp3', function(req, res) { //due flowplayer audio plugin
		manager.stream.action(req.query.file, function(stream, stat) {
			if (stream) {
				res.writeHead(200, {
					'Content-Type': 'audio/mpeg',
					'Content-Length': stat.size
				});
				util.pump(stream, res);
			} else {
				res.send('error');
			}
		});
	});	
};

module.exports = StreamController;

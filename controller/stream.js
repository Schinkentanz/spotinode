var util = require('util');

var StreamController = function(settings, resource, app, manager, utils, authenticator) {
	app.get('/stream.mp3', authenticator, function(req, res) { //stream.mp3 --> flowplayer audio plugin
		if (req.session.logged) {
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
		} else {
			utils.prepareJSON(res);
			res.send(JSON.stringify({
				logged: false
			}));
		}
	});	
};

module.exports = StreamController;

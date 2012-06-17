var resource = require('../resource.js').resource.index,
	settings = require('../settings.js').settings,
	fs = require('fs');

exports.index = function(req, res) {
	res.render('index', {
		title: resource.title
	})
}; 
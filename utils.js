var fs = require('fs');

exports.utils = {
	initialize: function(folder, a1, a2, a3, a4, a5) {
		var obj = {};
		fs.readdirSync('./' + folder).forEach(function(file) {
			var tmp = require('./' + folder + '/' + file);
			obj[file.substring(0, file.lastIndexOf('.'))] = new tmp(a1, a2, a3, a4, a5);
		});
		return obj;
	},
	prepareJSON: function(res) {
		res.contentType('application/json');
		res.charset = 'UTF-8';
	},
	hashCode: function(str) {
		var hash = 0;
		if (typeof(str) === 'undefined' || str.length == 0)
			return hash;
		for ( i = 0; i < str.length; i++) {
			char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
			// Convert to 32bit integer
		}
		return hash;
	}
};

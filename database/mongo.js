var mongojs = require('mongojs');

module.exports = function(settings) {
	var cred = settings.mongo.USERNAME ? settings.mongo.USERNAME + ':' + settings.mongo.PASSWORD + '@' : '';
	var host = settings.mongo.HOST + '/' + settings.mongo.DATABASE;
	
	var mongo = mongojs.connect(cred + host, settings.mongo.COLLECTIONS);

	return mongo;
};

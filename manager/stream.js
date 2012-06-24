var mongojs = require('mongojs'),
	ObjectId = mongojs.ObjectId;

var StreamManager = function(settings, dao, cache, utils) {
	this.action = function(id, callback) {
		dao.stream.action(id ? new ObjectId(id) : null, callback);
	};
};

module.exports = StreamManager;
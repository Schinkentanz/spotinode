var UserDAO = function(settings, mongo, utils) {
	this.get = function(query, callback) {
		mongo.users.find(query, function(error, files) {
			callback.call(null, !error && files.length > 0);
		});
	};
};

module.exports = UserDAO;

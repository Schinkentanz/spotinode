var Logger = function(settings) {
	this.log = function() {
		if (settings.logger.ACTIVE) {
			console.log(Array.prototype.slice.call(arguments));
		}
	}
};

module.exports = Logger;

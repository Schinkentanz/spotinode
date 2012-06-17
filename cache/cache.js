var Cache = function(settings) {
	var items = {};
	var cleanUp = function() {
		delete items;
		items = {};
	};
	setInterval(cleanUp, settings.cache.TTL * 1000);
	this.get = function(key) {
		return items[key] || null;
	};
	this.set = function(key, item) {
		items[key] = item;
	}
};

module.exports = Cache;

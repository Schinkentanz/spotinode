var IndexController = function(settings, resource, app, manager) {
	app.get('/', function(req, res) {
		res.render('index', {
			title: resource.index.title,
			welcome: resource.index.welcome
		});
	});	
};

module.exports = IndexController;

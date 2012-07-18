var IndexController = function(settings, resource, app, manager, utils, authenticator) {
	app.get('/', authenticator, function(req, res) {
		if (req.session.logged) {
			res.render('index', {
				title: resource.index.title
			});
		} else if (req.query.login) {
			utils.prepareJSON(res);
			res.send(JSON.stringify({
				logged: false
			}));
		} else {
			res.render('login', {
				title: resource.index.title
			});
		}
	});
	app.get('/logout', function(req, res) {
		req.session.logged = false;
		res.redirect('/');
	});
};

module.exports = IndexController;

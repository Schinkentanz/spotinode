module.exports = function(app, express, settings) {
	app.set('views', __dirname + settings.server.VIEW_PATH);
	app.set('view engine', settings.server.VIEW_ENGINE);
	
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	
	app.use(express.static(__dirname + settings.server.PUBLIC_PATH));
	
	app.configure('development', function() {
		app.use(express.errorHandler({
			dumpExceptions : true,
			showStack : true
		}));
	});
	app.configure('production', function() {
		app.use(express.errorHandler());
	});
}; 
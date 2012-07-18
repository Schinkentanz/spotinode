module.exports = function(app, express, settings) {
	app.set('views', __dirname + settings.server.VIEW_PATH);
	app.set('view engine', settings.server.VIEW_ENGINE);

	app.use(express.static(__dirname + settings.server.PUBLIC_PATH));
	
	app.use(express.methodOverride());
	app.use(express.bodyParser());
	app.use(express.cookieParser()); 
	app.use(express.session({
		secret: 'keyboard cat'
	}));
	app.use(app.router);
	
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
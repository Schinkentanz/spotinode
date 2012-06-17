var express = require('express'),
	app = module.exports = express.createServer();

require('./config/env.js')(app, express);
require('./config/routes.js')(app);

app.listen(3000, function() {
	console.log('Express server listening on port %d in %s mode', app.address().port, app.settings.env);
});





















/*var express = require('express'),
	routes = require('./routes'),
	settings = require('./settings.js').settings;


var app = module.exports = express.createServer();
app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});
app.configure('development', function() {
	app.use(express.errorHandler({
		dumpExceptions : true,
		showStack : true
	}));
});
app.configure('production', function() {
	app.use(express.errorHandler());
});



console.log(routes.fileController, routes.index);

app.get('/', routes.index);
app.get('/files', routes.files);







app.listen(3000, function() {
	console.log('Express server listening on port %d in %s mode', app.address().port, app.settings.env);
});
*/

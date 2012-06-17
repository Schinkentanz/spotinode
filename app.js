var express = require('express');

var app = module.exports = express.createServer();

//load resources, settings and utils
var resource = require('./config/resource.js').resource;
var settings = require('./config/settings.js').settings;
var utils = require('./utils.js').utils;

//configure server
require('./config/environment.js')(app, express, settings);

//initialize logger
//var logger = utils.initialize('logger', settings.Logger).logger;

//initialize mongo
var mongo = require('./database/mongo.js')(settings);

//initialize cache
var cache = utils.initialize('cache', settings).cache;

//initialize daos
var dao = utils.initialize('dao', settings, mongo, utils);

//initialize manager
var manager = utils.initialize('manager', settings, dao, cache, utils);

//initialize controller
var controller = utils.initialize('controller', settings, resource, app, manager, utils);

//fire it up 
app.listen(settings.server.PORT, function() {
	console.log('server is listening on port %d in %s mode', app.address().port, app.settings.env);
});

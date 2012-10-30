//initialize server
var express = require('express'),
    app = module.exports = express.createServer();

//load resources, settings and utils
var resource = require('./config/resource.js').resource,
    settings = require('./config/settings.js').settings,
    utils = require('./utils.js').utils;

//configure server
require('./config/environment.js')(app, express, settings);

//initialize logger
//var logger = utils.initialize('logger', settings.Logger).logger;

//initialize mongo, cache, daos, manager, authenticator, controller
var mongo = require('./database/mongo.js')(settings),
    cache = utils.initialize('cache', settings).cache,
    dao = utils.initialize('dao', settings, mongo, utils),
    manager = utils.initialize('manager', settings, dao, cache, utils),
    authenticator = require('./authenticator.js')(manager),
    controller = utils.initialize('controller', settings, resource, app, manager, utils, authenticator);

//fire it up 
app.listen(settings.server.PORT, function() {
    console.log('server is listening on port %d in %s mode', app.address().port, app.settings.env);
});

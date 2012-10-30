var FileController = function(settings, resource, app, manager, utils, authenticator) {
    var render = function(req, res, files, parent, view) {
        var folders = [];
        var _files = [];
        
        for (var file in files) {
            if (files[file]._type === settings.dao.file.types.FILE) {
                _files.push(files[file]);
            } else if (files[file]._type === settings.dao.file.types.FOLDER) {
                folders.push(files[file]);
            }
        }
        
        res.render(view, {
            files: _files.length > 0 ? _files : null,
            folders: folders.length > 0 ? folders : null,
            noLayout: true,
            utils: utils,
            parent: parent ? utils.idToString(parent) : null
        });
    };
    app.get('/files', authenticator, function(req, res) {
        if (req.session.logged) {
            manager.file.get({
                folder: req.query.folder
            }, req.query.cache, function(error, files, parent) {
                render(req, res, files, parent, 'file');
            });
        } else {
            
            //redirect --> index?
            
            utils.prepareJSON(res);
            res.send(JSON.stringify({
                logged: false
            }));
        }
    });
    
    app.get('/search', authenticator, function(req, res) {
        if (req.session.logged) {
            manager.file.search({
                search: req.query.search
            }, req.query.cache, function(error, files, parent) {
                render(req, res, files, parent, 'file');
            });
        } else {
            utils.prepareJSON(res);
            res.send(JSON.stringify({
                logged: false
            }));
        }
    });
    
    app.get('/files/index', authenticator, function(req, res) {
        utils.prepareJSON(res);
        if (req.session.logged) {
            manager.file.index(function(success, indexing) {
                res.send(JSON.stringify({
                    success: success,
                    indexing: indexing
                }));
            });
        } else {
            res.send(JSON.stringify({
                logged: false
            }));
        }
    });
    
    app.get('/files/status', authenticator, function(req, res) {
        utils.prepareJSON(res);
        if (req.session.logged) {
            manager.file.status(function(status) {
                res.send(JSON.stringify(status));
            });
        } else {
            res.send(JSON.stringify({
                logged: false
            }));
        }
    });
};

module.exports = FileController;

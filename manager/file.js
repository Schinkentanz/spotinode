var mongojs = require('mongojs'),
    ObjectId = mongojs.ObjectId;

var FileManager = function(settings, dao, cache, utils) {
    this.get = function(query, _cache, callback) {
        
        //todo: cache
        
        var _query = {
            parent: query.folder ? new ObjectId(query.folder) : null
        };
        dao.file.get(_query, function(error, files) {
            if (files.length > 0) {
                if (_query.parent === null) {
                    dao.file.get({
                        parent: files[0]._id
                    }, function(error, files) {
                        callback.call(null, error, files, null);
                    });
                } else {
                    dao.file.get({
                        _id: _query.parent
                    }, function(error, _files) {
                        callback.call(null, error, files, _files[0].parent);
                    });
                }
            }
        })
    };
    this.index = function(callback) {
        dao.file.start(settings.manager.file.ROOT_PATH, callback);
    };
    this.status = function(callback) {
        dao.file.status(callback);
    };
    this.search = function(query, _cache, callback) {
        
        //todo: cache
        
        var _query = {
            path: query.search ? new RegExp('.*' + query.search + '.*', 'i') : ''
        };
        if (_query.path !== '') {
            dao.file.get(_query, function(error, files) {
                dao.file.get({
                    parent: null
                }, function(error, _files) {
                    callback.call(null, error, files, _files[0]._id);
                });
            });
        } else {
            callback.call(null, error, [], null);
        }
    }
};

module.exports = FileManager;
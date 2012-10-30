var UserManager = function(settings, dao, cache, utils) {
    this.get = function(name, password, callback) {
        dao.user.get({
            name: name, 
            password: password
        }, callback);
    };
};

module.exports = UserManager;
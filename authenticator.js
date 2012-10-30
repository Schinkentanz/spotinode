module.exports = function(manager) {
    return function(req, res, next) {
        if (!req.session.logged) {
            manager.user.get(req.query.name, req.query.password, function(success) {
                req.session.logged = success;
                next();
            });
        } else {
            next();
        }
    };
};
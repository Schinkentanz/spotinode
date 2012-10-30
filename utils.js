String.prototype.startsWith = function(str) { return (this.match('^' + str) == str) };


var fs = require('fs');

exports.utils = {
    initialize: function() {
        var obj = {},
            args = Array.prototype.slice.call(arguments),
            folder = args.splice(0, 1);
        fs.readdirSync('./' + folder).forEach(function(file) {
            var tmp = require('./' + folder + '/' + file);
            obj[file.substring(0, file.lastIndexOf('.'))] = new tmp(args[0], args[1], args[2], args[3], args[4], args[5]);
        });
        return obj;
    },
    prepareJSON: function(res) {
        res.contentType('application/json');
        res.charset = 'UTF-8';
    },
    hashCode: function(str) {
        var hash = 0;
        if (typeof(str) === 'undefined' || str.length == 0)
            return hash;
        for ( i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    },
    idToString: function(id) {
        return id.toString().replace('"', '');
    }
};

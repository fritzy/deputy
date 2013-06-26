var Bucket = require('./bucket');

function Path(path) {
    var np = this.normalize(path);
    this.path = np.path;
    this.nodes = np.nodes;
}

(function() {

    this.normalize = function (path) {
        if (path.length === 0 || path[0] != '/') {
            path = '/' + path;
        }
        var nodes = path.split('/');
        nodes[0] = 'root';
        return {path: path, nodes: nodes};
    };

    this.parentOf = function () {
        if (this.nodes.length > 1) {
            return new Path('/' + this.nodes.slice(-1).join('/'));
        }
    };
 
}).call(Path.prototype);

function Directory(name) {
    Bucket.call(this, name);
    /* node:/path/name
     * { name: xxxx, path, children: [{name, type, key}]}
     *  
     *
     *
     *
     *
     */

}

(function() {

    function getDirectoryIndex(cb) {
        this.lup.get('directory', {valueEncoding: 'msgpack'}, function (err, dir) {
            if (err || !dir) {
                dir = {};
            }
            cb(dir);
        });
    }

    this.mkdir = function(path, cb) {
        this.lock.runwithlock(function () {
            getDirectoryIndex(function (dir) {
                if (dir.hasOwnProperty(path)) {
                    cb("Already Exists");
                } else {
                    dir = 1
                }
            });
        });
    };

    this.hasChild = function (name, type) {
    };

    this.getRoot = function () {
        //this.bucket.get('node:root', undefined, 
    };

    this.direxists = function(path, cb) {
        var nodes = path.split('/');
        for (nidx in nodes) {
            
        }
    };

    this.exists = function(path, cb) {
    };

    this.rmdir = function(path, cb) {
    };

    this.move = function (start, end, cb) {
    };

    this.write = function (path, type, data, cb) {
    };

    this.touch = function (path, type, cb) {
    };

    this.read = function (path, type, cb) {
    };

    this.getMany = function (pattern, type, cb) {
    };


}).call(Directory.prototype);

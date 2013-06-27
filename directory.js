var Bucket = require('./bucket');
var uuid = require('node-uuid');

function Path(path) {
    var np = this.normalize(path);
    this.path = np.path;
    this.nodes = np.nodes;
    this.name = np.nodes[np.nodes.length - 1];
}

(function() {

    this.normalize = function (path) {
        if (path.length === 0 || path[0] != '/') {
            path = '/' + path;
        }
        var nodes = path.split('/');
        nodes[0] = '__root__';
        return {path: path, nodes: nodes};
    };

    this.parentOf = function () {
        if (this.nodes.length > 1) {
            return new Path('/' + this.nodes.slice(1, -1).join('/'));
        }
    };
 
}).call(Path.prototype);

function Directory(name) {
    Bucket.call(this, name);
    this.atomic(function (done) {
        console.log("got a lock");
        this.get('directory', function (err, dir) {
            console.log(dir);
            var key;
            if (err || !dir) {
                key = 'node:' + uuid();
                dir = {'/': key};
                this.put(key, {name: '__root__', 'path': '/', children: []}, function (err) {
                    this.put('directory', dir, function (err) {
                        done();
                    });
                }.bind(this));
            } else {
                done();
            }
        }.bind(this));
    });
    /* node:/path/name
     * { name: xxxx, path, children: [{name, type, key}]}
     */

}

Directory.prototype = Object.create(Bucket.prototype);
Directory.prototype.constructor = Directory;
//Directory.prototype.constructor = Directory;

(function() {


    this.mkdir = function(path, cb) {
        path = new Path(path);
        this.atomic(function (done) {
            this.get('directory', function (err, dir) {
                var key;
                if (dir.hasOwnProperty(path.path)) {
                    done("Already exists.");
                } else if (!dir.hasOwnProperty(path.parentOf().path)) {
                    done("Parent does not exist.");
                } else {
                    key = 'node:' + uuid();
                    this.put(key, {name: path.name, path: path.path, children: []}, function (err) {
                        dir[path.path] = key;
                        this.put('directory', dir, function (err) {
                            done(err);
                        });
                    }.bind(this));
                }
            }.bind(this));
        }, cb);
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

//setTimeout(function() {console.log('10 seconds');}, 10000);
var d = new Directory('thingy');
d.mkdir('/hey', function () {console.log("done", arguments);});
d.get('directory', function () {console.log(arguments)});

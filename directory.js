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

function Directory(name, options) {
    Bucket.call(this, name, options);
    this.atomic(function (done) {
        this.get('directory', function (err, dir) {
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
     * { name: xxxx, path, children[type][name]: key}
     */

}

Directory.prototype = Object.create(Bucket.prototype);
Directory.prototype.constructor = Directory;

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
                    this.put(key, {name: path.name, path: path.path, children: {}}, function (err) {
                        dir[path.path] = key;
                        this.put('directory', dir, function (err) {
                            done(err);
                        });
                    }.bind(this));
                }
            }.bind(this));
        }, cb);
    };

    this.hasObject = function (name, type) {
    };

    this.getRoot = function () {
        //this.bucket.get('node:root', undefined, 
    };

    this.direxists = function(path, cb) {
        var nodes = path.split('/');
        for (nidx in nodes) {
            
        }
    };

    this.objExists = function(path, type, cb) {
    };

    this.rmdir = function(path, cb) {
    };

    this.moveDir = function (start, end, cb) {
        start = new Path(start);
        end = new Path(end);
        this.atomic(function (done) {
            this.get('directory', function (err, dir) {
                var dirname;
                var changelist = [];
                var didx;
                if (!dir.hasOwnProperty(start.path)) {
                    done("Starting not found.");
                } else if (dir.hasOwnProperty(end.path)) {
                    done("Ending path already exists.");
                } else {
                    for (dirname in dir) {
                        if (dirname.slice(0, start.path.length) === start.path) {
                            changelist.push(dirname);
                        }
                    }
                    for (didx in changelist) {
                        dir[end.path + changelist[didx].slice(start.path.length)] = dir[changelist[didx]];
                        delete dir[changelist[didx]];
                    }
                    this.write('directory', dir, function (err) {
                        done(err);
                    });
                }
            }.bind(this));
        }, cb);
    };
    
    this.moveObject = function (start, type, end, cb) {
        start = new Path(start);
        var start_parent = start.parentOf();
        end = new Path(end);
        var end_parent = end.parentOf();
        this.atomic(function (done) {
            this.get('directory', function (err, dir) {
                if (!dir.hasOwnProperty(start_parent.path)) {
                    done("Starting directory doesn't exist.");
                } else if (!dir.hasOwnProperty(end_parent.path)) {
                    done("Ending directory doesn't exist.");
                } else {
                    this.get(dir[start_parent.path], function (err, start_node) {
                        if (!start_node.children.hasOwnProperty(type) || !start_node.children[type].hasOwnProperty(start.name)) {
                            done("Object not found.");
                        } else {
                            this.get(dir[end_parent.path], function(err, end_node) {
                                if (end_node.children.hasOwnProperty(type) && end_node.children[type].hasOwnProperty(end.name)) {
                                    done("End object already exists.");
                                } else {
                                    if (!end_node.children.hasOwnProperty(type)) end_node.children[type] = {};
                                    end_node.children[type][end_path.name] = start_node.children[type][start_path.name];
                                    delete start_node.children[type][start_path.name];
                                    this.put(dir[start_parent.path], start_node, function (err) {
                                        if (err) {
                                            done(err);
                                        } else {
                                            this.put(dir[end_parent.path], end_node, function (err) {
                                                done(err);
                                            });
                                        }
                                    }.bind(this));
                                }
                            }.bind(this));
                        }
                    }.bind(this));
                }
            }.bind(this));
        }, cb);
    };

    this.write = function (path, type, data, cb) {
        var path = new Path(path);
        var parent = path.parentOf();
        this.atomic(function (done) {
            this.get('directory', function (err, dir) {
                if (!dir.hasOwnProperty(parent.path)) {
                    done("Directory not found.");
                } else {
                    this.get(dir[parent.path], function (err, node) {
                        var key;
                        if (!node.children.hasOwnProperty(type)) node.children[type] = {};
                        if (!node.children[type].hasOwnProperty(path.name)) {
                            key = 'object:' + uuid();
                            node.children[type][path.name] = key;
                        }
                        this.put(dir[parent.path], node, function (err) {
                            this.put(key, data, function (err) {
                                done(false, key);
                            });
                        }.bind(this));
                    }.bind(this));
                }
            }.bind(this));
        }, cb);
    };

    this.touch = function (path, type, cb) {
    };

    this.read = function (path, type, cb) {
        var path = new Path(path);
        var parent = path.parentOf();
        this.atomic(function (done) {
            this.get('directory', function (err, dir) {
                if (!dir.hasOwnProperty(parent.path)) {
                    done("Directory not found.");
                } else {
                    this.get(dir[parent.path], function (err, node) {
                        if (node.children.hasOwnProperty(type) && node.children[type].hasOwnProperty(path.name)) {
                            this.get(node.children[type][path.name], function (err, obj) {
                                done(err, obj);
                            });
                        } else {
                            done("Object not found.");
                        }
                    }.bind(this));
                }
            }.bind(this));
        }, cb);
    };

    this.getMany = function (pattern, type, cb) {
    };


}).call(Directory.prototype);

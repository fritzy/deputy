var Bucket = require('./bucket');
var uuid = require('node-uuid');
var async = require('async');

function Path(path) {
    var np = this.normalize(path);
    this.path = np.path;
    this.nodes = np.nodes;
    this.name = np.nodes[np.nodes.length - 1];
}

(function() {

    this.normalize = function (path) {
        if (path === '/') {
            return {path: '/', nodes: ['__root__']};
        }
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
    var dirinst = this;
    this.atomic(function (done) {
        this.get('dir:__root__', function (err, dir) {
            var key;
            if (err || !dir) {
                console.log("overriding root", err, dirinst.options);
                this.put('dir:__root__', {'path': '/', children: {}, subdirs: {}}, function (err) {
                    done();
                });
            } else {
                done();
            }
        }.bind(this));
    });

}

Directory.prototype = Object.create(Bucket.prototype);
Directory.prototype.constructor = Directory;

(function() {

    this.traverse = function (atomic, path, cb) {
        var curdir;
        if (path.name === '__root__') {
            atomic.get('dir:__root__', function (err, dir) {
                cb(err, dir, 'dir:__root__', path);
            });
        } else {
            async.reduce(path.nodes.slice(1), {nextkey: 'dir:__root__'}, function (state, node, acb) {

                atomic.get(state.nextkey, function (err, dir) {
                    state.dir = dir;
                    if (dir.subdirs.hasOwnProperty(node)) {
                        state.nextkey = dir.subdirs[node];
                        acb(false, state);
                    } else {
                        acb("Path not found");
                    }
                }.bind(this));
            }.bind(this), function (err, state) {
                if (!err) {
                    atomic.get(state.nextkey, function (err, dir) {
                        cb(err, dir, state.nextkey);
                    });
                } else {
                    cb(err);
                }
            });
        }
    };

    this.getDir = function (path, cb) {
        var dirinst = this;
        path = new Path(path);
        this.atomic(function (done) {
            dirinst.traverse(this, path, done);
        }, cb);
    };

    this.makeDir = function(path, cb) {
        var path = new Path(path);
        var dirinst = this;
        this.atomic(function (done) {
            dirinst.traverse(this, path.parentOf(), function (err, dir, dirkey, parent) {
                if (err) {
                    done(err);
                } else {
                    if (dir.subdirs.hasOwnProperty(path.nodes.slice(-1)[0])) {
                        done("Already exists.");
                    } else {
                        var key = 'dir:' + uuid();
                        this.put(key, {path: path.path, children: {}, subdirs: {}}, function (err) {
                            dir.subdirs[path.nodes.slice(-1)[0]] = key;
                            this.put(dirkey, dir, function (err) {
                                done(err, key);
                            });
                        }.bind(this));
                    }
                }
            }.bind(this));
        }, function (err, key) {
            cb(err, key);
        });
    };

    this.hasObject = function (name, type) {
    };

    this.getRoot = function () {
        //this.bucket.get('node:root', undefined, 
    };

    this.direxists = function(path, cb) {
        var path = new Path(path);
        this.traverse(path, cb);
    };

    this.objExists = function(path, type, cb) {
    };

    this.rmdir = function(path, cb) {
    };

    /*
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
    */

    this.write = function (path, type, name, data, cb) {
        var path = new Path(path);
        var dirinst = this;
        this.atomic(function (done) {
            dirinst.traverse(this, path, function (err, dir, dirkey) {
                if (err || !dir) {
                    done("Directory not found.");
                } else {
                    var key;
                    if (!dir.children.hasOwnProperty(type)) dir.children[type] = {};
                    if (!dir.children[type].hasOwnProperty(name)) {
                        key = 'object:' + type + ':' + uuid();
                        dir.children[type][name] = key;
                    }
                    this.put(dirkey, dir, function (err) {
                        this.put(key, data, function (err) {
                            done(false, key);
                        });
                    }.bind(this));
                }
            }.bind(this));
        }, cb);
    };


    this.touch = function (path, type, cb) {
    };

    this.read = function (path, type, name, cb) {
        var path = new Path(path);
        var dirinst = this;
        console.log(path);
        this.atomic(function (done) {
            dirinst.traverse(this, path, function (err, dir, dirkey) {
                if (err || !dir) {
                    done("Directory not found.");
                } else {
                    if (dir.children.hasOwnProperty(type) && dir.children[type].hasOwnProperty(name)) {
                        this.get(dir.children[type][name], function (err, obj) {
                            done(err, obj);
                        });
                    } else {
                        done("Object not found.");
                    }
                }
            }.bind(this));
        }, cb);
    };

    this.list = function (path, type, offset, limit, cb) {
        offset = offset || 0;
        limit = limit || 50;
        var path = new Path(path);
        this.atomic(function (done) {
            this.traverse(path, function (err, dir, dirkey) {
                if(err || !dir) {
                    done("Path not found.");
                } else {
                    if (dir.children.hasOwnProperty(type)) {
                        var items = Object.keys(dir.children[type]);
                        var length = items.length;
                        items.sort();
                        items = items.slice(offset, limit);
                        done(false, {offset: offset, limit: limit, total: total, type: type, items: items});
                    } else {
                        done(false, {offset: offset, limit: limit, total: 0, type: type, items: []});
                    }
                }
            }.bind(this));
        }.bind(this), cb);
    };

    this.getKeys = function (path, type, cb) {
        var path = new Path(path);
        this.traverse(path, function (err, dir, dirkey) {
            if(err || !dir) {
                done("Path not found.");
            } else {
                if (dir.children.hasOwnProperty(type)) {
                    var values = [];
                    for (var iname in dir.children[type]) {
                        values.push(dir.children[type][iname]);
                    }
                    cb(false, values);
                } else {
                    cb(false, []);
                }
            }
        }.bind(this));
    };

    this.getMany = function (pattern, type, cb) {
    };


}).call(Directory.prototype);

module.exports = Directory;

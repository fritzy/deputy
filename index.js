var memdown = require('memdown');
var memdown_factory = function (location) { return new memdown(location); };
var levelup = require('levelup');
var async   = require('async');
var Padlock = require('padlock').Padlock;


/*
var x = levelup('./nope');
x.put('hi', 'cheese', function(err) {
    x.get('hi', function(err, data) {
        console.log(arguments);
    });
});
*/

var Bucket = function (name, options) {
    this.name = name;
    this.options = options || {};
    if (!this.options.location) {
        this.options.location = './' + this.name;
    }
    if (this.options.inMemory === true) {
        this.lup = levelup(this.options.location, {
            db: memdown_factory
        });
    } else {
        console.log("loading...", this.options.location);
        this.lup = levelup(this.options.location, {
            
        });
    };
    this.lock = new Padlock();
};

(function () {

    this.keyFilter = function (mapper, cb) {
        this.lock.acquire(function() {
            var keys = [];
            var key_stream = this.lup.createReadStream({keys: true, values: true});
            key_stream.on('data', function (data) {
                if (mapper(data)) {
                    keys.push(data.key);
                }
            });
            key_stream.once('end', function () {
                key_stream.removeAllListeners();
                console.log("done");
                this.lock.release();
                cb(keys);
            }.bind(this));
        }, [], this);
    };
    
    this.mapReduce = function (mapper, reducer, cb) {
        options = options || {};
        options.keys = true;
        options.values = true;
        this.lock.acquire(function() {
            var mapped = {};
            var key_stream = this.lup.createReadStream(options);
            key_stream.on('data', function (data) {
                var pairs = mapper(data);
                for (var pidx in pairs) {
                    if (!mapped.hasOwnProperty(pairs[pidx].key)) {
                        mapped[pairs[pidx].key] = [pairs[pidx].value];
                    } else {
                        mapped[pairs[pidx].key].push(pairs[pidx].value);
                    }
                }
            });
            key_stream.once('end', function () {
                key_stream.removeAllListeners();
                this.lock.release();
                results = {};
                for (var midx in mapped) {
                    results[midx] = reducer(midx, mapped[midx]);
                }
                cb(results);
            }.bind(this));
        }, [], this);
    };

    this.getKeys = function (keys, cb) {
        var batch = this;
        var results = {};
        this.lock.runwithlock(function() {
            console.log("coalating bitches");
            console.log(keys);
            async.forEach(keys, function (item, callback) {
                console.log(arguments);
                this.lup.get(item, function (err, value) {
                    results[item] = value;
                    callback();
                });
            }.bind(this), function (err) {
                this.lock.release();
                cb(results);
            }.bind(this)); 
        }, [], this);
    };


    this.put = function (key, value, options, callback) {
        var batch = this;
        this.lock.runwithlock(this.lup.put, [key, value, options, function (err) {
            batch.lock.release();
            if (callback !== undefined) callback(err);
        }], this.lup);
    };

    this.get = function (key, options, callback) {
        this.lock.runwithlock(this.lup.get, [key, options, function (err, result) {
            this.lock.release();
            callback(err, result);
        }], this);
    };

    this.del = function (key, options, callback) {
        this.lock.runwithlock(this.lup.del, [key, options, function (err) {
            this.lock.release();
            callback(err);
        }], this);
    };
    
    this.batch = function () {
    };

    this.atomic = function (atomic_function) {
        this.lock.acquire(atomic_function, [function () {
            this.lock.release();
        }]);
    };

}).apply(Bucket.prototype);

setTimeout(function() {
}, 10000);

var b = new Bucket('test');
b.put('hi', 'not');
b.put('cat', 'crap');
b.put('corn', 'derp');
b.put('cword', 'hi');
b.put('not', 'no');
b.keyFilter(function (data) {
    return (data.key[0] == 'c');
}, function (keys) {
    console.log(keys);
    console.log("coalating...");
    b.getKeys(keys, function(results) {
        console.log("coalate:", results);
    });
});

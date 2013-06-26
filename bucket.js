var memdown         = require('memdown');
var memdown_factory = function (location) { return new memdown(location); };
var levelup         = require('levelup');
var async           = require('async');
var Padlock         = require('padlock').Padlock;
var msgpack         = require('msgpack');

var Bucket = function (name, options) {
    this.name = name;
    this.options = options || {};
    this.options.valueEncoding = 'msgpack';
    if (!this.options.location) {
        this.options.location = './' + this.name;
    }
    if (this.options.inMemory === true) {
        this.lup = levelup(this.options.location, {
            db: memdown_factory
        });
    } else {
        this.lup = levelup(this.options.location, {
            valueEncoding: 'msgpack'
        });
    };
    this.lock = new Padlock();
};

(function () {

    function keyFilter(filter, cb) {
        var keys = [];
        var key_stream = this.lup.createReadStream({keys: true, values: true});
        key_stream.on('data', function (data) {
            if (filter(data)) {
                keys.push(data.key);
            }
        });
        key_stream.once('end', function () {
            key_stream.removeAllListeners();
            cb(keys);
        }.bind(this));
    }
    this.keyFilter = function (filter, cb) {
        this.lock.runwithlock(keyFilter, [filter, function () { this.lock.release(); cb.apply(this, arguments); }.bind(this)], this);
    };
    
    function getKeys(keys, cb) {
        var results = {};
        async.forEach(keys, function (item, callback) {
            this.lup.get(item, function (err, value) {
                results[item] = value;
                callback(err);
            });
        }.bind(this), function (err) {
            this.lock.release();
            cb(err, results);
        }.bind(this)); 
    }
    this.getKeys = function (keys, cb) {
        this.lock.runwithlock(getKeys, [keys, function () { this.lock.release(); cb.apply(this, arguments); }.bind(this)], this);
    };

    /* mapReduce
     * arguments ({
     *      map: function ({key, value}) { return [{key: mapkey, value: mapvalue}, ...]; },
     *      reduce: function (mapkey, [mapvalue, ...]) { return reduced; },
     *      batch: optional function ({mapkey: reduced, ...}) { return [{key: value}, ...]; },
     *      keys: optional [key, key, ...]
     *  },
     *  callback: function (err, {mapkey: reduced, ...})
     *  )
     *
     *  A map is called for each key pair. A map returns an array of key value pairs to be reduced.
     *  Key value pairs may be derived keys and values, or database keys and values.
     *  Each map call may return any size of key value pair array.
     *
     *  The reduce function is called from the collated mapkey, mapvalue pairs.
     *  A reduce function returns a single result to be assigned to that mapkey as a whole.
     *
     *  The optional batch function returns an array of database keys with their values to set in batch,
     *  atomic with the rest of the map-reduce.
     *  Batches use levelup syntax https://github.com/rvagg/node-levelup#batch
     *
     *  The callback recieves an object of mapkeys, each with their reduced value.
     */
    function mapReduce(args, callback) {
        var mapped = {};
        var results = {};
        var key_stream;
        var kidx;
        function handleMap (data) {
            var pairs = args.map(data);
            for (var pidx in pairs) {
                if (!mapped.hasOwnProperty(pairs[pidx].key)) {
                    mapped[pairs[pidx].key] = [pairs[pidx].value];
                } else {
                    mapped[pairs[pidx].key].push(pairs[pidx].value);
                }
            }
        }
        function handleReduce() {
            for (var midx in mapped) {
                results[midx] = args.reduce(midx, mapped[midx]);
            }
        }
        function handleFinish() {
            var batch;
            if (typeof args.batch === 'function') {
                batch = args.batch(results);
                this.lup.batch(batch, function (err) {
                    cb(err, results);
                });
            } else {
                cb(false, results);
            }
        }
        //if we have keys
        if (!args.hasOwnProperty('keys') || typeof args.keys !== 'object' || !args.keys.hasOwnProperty('length') || args.keys.length === 0) {
            key_stream = this.lup.createReadStream({keys: true, values: true});
            key_stream.on('data', handleMap);
            key_stream.once('end', function () {
                key_stream.removeAllListeners();
                handleReduce();
                handleFinish();
            }.bind(this));
        } else {
            getKeys(args.keys, function (err, keydata) {
                for (kidx in keydata) {
                    handleMap({key: kidx, value: keydata[kidx]});
                }
                handleReduce();
                handleFinish();
            });
        }
    }
    this.mapReduce = function (args, callback) {
        this.lock.runwithlock(mapReduce, [args, function () { this.lock.release(); callback.apply(this, arguments); }.bind(this)], this);
    };

    this.put = function (key, value, callback) {
        this.lock.runwithlock(this.lup.put, [key, value, function (err) {
            this.lock.release();
            if (callback !== undefined) callback(err);
        }.bind(this)], this.lup);
    };


    this.get = function (key, callback) {
        this.lock.runwithlock(this.lup.get, [key, {}, function (err, result) {
            this.lock.release();
            callback(err, result);
        }.bind(this)], this.lup);
    };

    this.del = function (key, callback) {
        this.lock.runwithlock(this.lup.del, [key, {}, function (err) {
            this.lock.release();
            callback(err);
        }.bind(this)], this.lup);
    };


    function update(key, updater, cb) {
        updater(result, function (newvalue) {
            this.lup.put(key, newvalue, function (err) {
                this.lock.release();
            });
        });
    }
    this.update = function (key, updater, cb) {
        this.lock.runwithlock(update, [key, updater, function () { this.lock.release(); callback.apply(this, arguments); }.bind(this)], this);
    };

    var bucket = this;
    console.log(bucket);

    this.unatomic = {
        keyFilter: keyFilter.bind(bucket),
        getKeys: getKeys.bind(bucket),
        mapReduce: mapReduce.bind(bucket),
        put: function() { bucket.lup.put.apply(bucket.lup, arguments); },
        get: function() { bucket.lup.get.apply(bucket.lup, arguments); },
        del: function() { bucket.lup.del.apply(bucket.lup, arguments); },
        batch: function() { bucket.lup.batch.apply(bucket.lup, arguments); },
        update: update.bind(bucket)
    }
    
    this.atomic = function (atomic_function, cb) {
        this.lock.acquire(function () {
            atomic_function.call(this.unatomic, function () {
                this.lock.release();
                cb.apply(this, arguments);
            });
        }, [], this);
    };

}).apply(Bucket.prototype);

module.exports = Bucket;
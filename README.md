# deputy

Local Key-Bucket and Directory Database

deputy builds on levelup to provide advanced querying for your embedded key-store.
For now, deputy contains buckets and directories.

Buckets get niceties like proper Map-Reduce, key filters, indexes, and other queries.  
Directories build on that with directory nodes that provide key-sets within itself.

## Bucket

### put

    arguments (
        key,
        value,
        function callback(err)
    )

### get

    arguments (
        key,
        function callback(err, value)
    )

### del

    arguments (
        key,
        function callback(err)
    )

### getKeys

    arguments (
        [key1, key2, ...],
        function callback(err, results)) 
    )

### update

    arguments (
        key,
        function updater(result, cb),
        function callback(err)
    )


    // somekey: {description: 'this is a counter', counter: 1}
    deputy.update('somekey', function(value, done) {
        value.counter += 1;
        done(value);
    });
    // somekey: {description: 'this is a counter', counter: 2}

### keyFilter

    arguments ( 
        function filter({key, data}) { return boolean },
        function callback(err, keys)
    )


Calls filter with each key-value in the bucket.
Return true to keep the key in the results


### mapReduce

mapReduce

    arguments (
        {
            map: function ({key, value}) { return [{key: mapkey, value: mapvalue}, ...]; },
            reduce: function (mapkey, [mapvalue, ...]) { return reduced; },
            batch: optional function ({mapkey: reduced, ...}) { return [{key: value}, ...]; },
            keys: optional [key, key, ...]
        },
        function callback(err, {mapkey: reduced, ...})
    )

A map is called for each key pair. A map returns an array of key value pairs to be reduced.
Key value pairs may be derived keys and values, or database keys and values.
Each map call may return any size of key value pair array.

The reduce function is called from the collated mapkey, mapvalue pairs.
A reduce function returns a single result to be assigned to that mapkey as a whole.

The optional batch function returns an array of database keys with their values to set in batch,
atomic with the rest of the map-reduce.
Batches use levelup syntax https://github.com/rvagg/node-levelup#batch

The callback recieves an object of mapkeys, each with their reduced value.

If keys are supplied, those keys will be mapped reduced. In the future, this will be a generator or an array.

### atomic

    arguments (
        function atomic_action(done_callback)
    )

While levelup does keep key commands in order, and batches allow atomic batch writes and reads,
other javascript events may insert commands outside of batches, for things like a write dependant on the value of a read.

This gives you a function where all commands are locked until execution is finished.

## Directory

All of Bucket plus...

### makeDir

    arguments (
        path,
        function callback(err)
    )

### moveDir

    arguments (
       start_path,
       end_path,
       function callback(err)
    )

### moveObject

    arguments (
        start_path,
        type,
        end_path,
        function callback(err)
    )

### write

    arguments (
        path,
        type,
        data,
        function callback(err)
    )

### read

    arguments (
        path,
        type,
        function callback(err, result)
    )

# Planned

* EventEmitter (WildEmitter) for key CRUD in buckets and directories.
* Directory tweaked map-reduce to include directory index information.
* Explicit index support in Bucket (queryByIndex, setIndex, etc)
* Generators for key filters

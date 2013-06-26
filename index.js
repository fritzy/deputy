var Bucket = require('./bucket');
var Directory = require('./directory');

/*
var x = levelup('./nope');
x.put('hi', 'cheese', function(err) {
    x.get('hi', function(err, data) {
        console.log(arguments);
    });
});
*/



setTimeout(function() {
}, 10000);

var b = new Bucket('test');
b.put('hi', {cheese: 'turd'});
b.put('cat', {crap: 'bucket'});
b.put('corn', {derp: 'inham'});
b.keyFilter(function (data) {
    return (data.key[0] == 'c');
}, function (keys) {
    console.log(keys);
    console.log("collating...");
    console.log(keys);
    b.getKeys(keys, function(err, results) {
        console.log("coalate:", results);
    });
});

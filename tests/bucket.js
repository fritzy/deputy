var Bucket = require('../bucket');
var fs = require('fs');

var testb;

var bns = fs.readFileSync(__dirname + '/boy_named_sue.txt', 'utf8');

exports['Create a bucket'] = function (test) {
    testb = new Bucket('unittest');
    test.done();
};
 
exports['Write keys to bucket'] = function (test) {
    stanzas = bns.split('\n\n');
    for (var sidx in stanzas) {
        testb.put('bns_' + sidx, {text: stanzas[sidx]});
    }
    test.done();
};

exports['Get keys from bucket'] = function (test) {
    var keys = ['bns_0', 'bns_1', 'bns_2', 'bns_3', 'bns_4', 'bns_5', 'bns_6', 'bns_7', 'bns_8', 'bns_9'];
    testb.getKeys(keys, function (err, reply) {
        test.ifError(err);
        test.done();
    });
};

exports['Map Reduce query'] = function (test) {
    testb.mapReduce({
        map: function (data) {
            var result = [];
            var wordfind = /\w+/g;
            var words = data.value.text.match(wordfind);
            for (var widx in words) {
                result.push({key: words[widx].toLowerCase(), value: 1});
            }
            return result;
        },
        reduce: function (mapkey, values) {
            return values.length;
        },
    }, function(err, results) {
        test.done();
    });
};

exports['Delete a bucket'] = function (test) {
    test.done();
};


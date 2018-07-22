var async = require('async');

/**
 * 使用series函数方法
 * */

async.series([
    function (callback) {
        callback(null, 'hello');
    },
    function (callback) {
        callback(null, 'async');
    },
    function (callback) {
        callback(null, 'series')
    }
], function (err, result) {
    console.log(result);
})
// 瀑布模式流程控制
async.waterfall([
    function (callback) {
        // 当回调函数的第一个参数为非空时，waterfall会
        callback(null, 1);
    },
    function (data, callback) {
        console.log(data);
        callback('test', 2);
    },
    function (data, callback) {
        console.info(data);
        callback(null, 3)
    }
], function (err, results) {
    console.log(results)
})
// 并行流程控制
async.parallel([
    function (callback) {
        setTimeout(function () {
            callback(null, 'one')
        }, 2000)
    },
    function (callback) {
        setTimeout(function () {
            callback(null, 'two')
        }, 1000)
    }
], function (err, results) {
    console.log(results)
})

// 队列流程
var q = async.queue(function (task, callback) {
    console.log('worker is processing task:' + task.name)
    callback()
})

q.push({name: 'foo'}, function (err) {
    console.log('finished processing foo');
})

q.push({name: 'bar'}, function (err) {
    console.log('finished processing bar');
})

q.empty = function () {
    console.log('no more tasks waiting');
}

q.drain = function () {
    console.log('all tasks have been processed');
}
/*var bufferUTF8 = new BufferModule('nodejs', 'utf8');

console.log("The variable bufferUTF8's length is" + bufferUTF8.length + ".");
console.log("The variable bufferUTF8 is " + bufferUTF8 + ".");

for (var i = 0; i < bufferUTF8.length; i++) {
    console.log("bufferUTF8["+i+"] is " + bufferUTF8[i]);
    console.log("bufferUTF8["+i+"].toString is " + bufferUTF8[i].toString());
}

console.log(bufferUTF8.toString('utf8')); // utf8编码
console.log(bufferUTF8.toString('hex'));

console.log('--- Process nextTick ------');
console.info();*/

/**
 * 使用setTimeout()方法执行异步操作
 * */

console.time('startB');
console.log('start-setTimeout');

setTimeout(function () {
    console.log('nextTick callback 2');
}, 0);
console.log('scheduled-setTimeout');
console.timeEnd('startB')

/**
 * 使用process.nextTick()方法
 *
 * */

console.time('startA');
console.log('start-nextTick');

process.nextTick(function () {
    console.log('nextTick callback 1')
});

console.log('scheduled-nextTick');
console.timeEnd('startA')
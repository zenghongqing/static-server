### node静态文件服务器
功能:
1) 读取静态文件: fs.createReadStream创造一个可读流pipe到res返回给客户端
2) 访问目录可以自动寻找文件index.html, 如果没有则列出文件列表。常见的模板引擎: handlebar和ejs，ejs用法分别为render(‘文件内容’，‘变量参数’)，handlebar用法如下：
```
function list() {
	    let tmpl = fs.readFileSync(path.resolve(__dirname, 'template', 'list.html'), 'utf8');
	    return handlebars.compile(tmpl);
	}
```
3) MIME类型支持：使用mime模块获取并设置
```
res.setHeader('Content-type', mime.getType(p) + ';charset=utf8');
```
4) 缓存支持
* ETag: 内容的hash值 下一次客户端请求在请求头里添加if-none-match: etag值
* Last-Modified: 最后的修改时间 下一次客户端请求在请求头里添加if-modified-since: Last-Modified值
当客户端缓存了目标资源但不确定该缓存资源是否是最新版本的时候, 
就会发送一个条件请求，这样就可以辨别出一个请求是否是条件请求，
在进行条件请求时,客户端会提供给服务器一个If-Modified-Since请求头,
其值为服务器上次返回的Last-Modified响应头中的Date日期值,
还会提供一个If-None-Match请求头,值为服务器上次返回的ETag响应头的值。

5) 压缩

客户端发送请求，通过头部的Accept-Encoding: gzip, deflate告诉服务器支持哪些压缩格式，服务器根据支持的压缩格式压缩内容，不支持的话则不压缩。
6) 断点续传

服务端根据请求头的Range:bytes=0-xxx来判断是否做Range请求，如果这个值存在而且有效，则只发回请求的那部分文件内容，响应的状态码变成206，表示Partial Content，并设置Content-Range。

7) 全局命令执行

* npm link命令通过链接目录和可执行文件，实现npm包命令的全局可执行

* package.json里配置
```
{
    bin: {
        "hope-server": "bin/hope"
    }
}
```
* bin目录下新建hope，通过yargs配置命令行传参数
```
// 告诉电脑用node运行我的文件
	#! /usr/bin/env node
	
	const yargs = require('yargs');
	const init = require('../src/index.js');
	const argv = yargs.option('d', {
		alias: 'root',
		demand: 'false',    // 是否必选
		type: 'string',
		default: process.cwd(),
		description: '静态文件根目录'  // 提示
	}).option('o', {
		alias: 'host',
		demand: 'false',
		default: 'localhost',
		type: 'string',
		description: '配置监听的主机'
	}).option('p', {
		alias: 'port',
		demand: 'false',
		type: 'number',
		default: 8080,
		description: '配置端口号'
	}).option('c', {
		alias: 'child',
		demand: 'false',
		type: 'boolean',
		default: false,
		description: '是否子进程运行'
	})
	.usage('hope-server [options]') // 用法格式
	.example(
	'hope-server -d / -p 8000 -o localhost', '在本机的9090端口上监听客户端的请求'
	).help('h').argv;
		
	// 启动服务
	init(argv);
```
* 子进程运行(spawn实现)
```
const { spawn } = require('child_process');
	const Server = require('./hope');
	
	function init(argv) {
	    // 如果配置为子进程开启服务
	    if (argv.child) {
	        //子进程启动服务
	        const child = spawn('node', ['hope.js', JSON.stringify(argv)], {
	            cwd: __dirname,
	            detached: true,
	            stdio: 'inherit'
	        });
	
	        //后台运行
	        child.unref();
	        //退出主线程，让子线程单独运行
	        process.exit(0);
	    } else {
	        const server = new Server(argv);
	        server.start();
	    }
	}
	
	module.exports = init;

```

hope.js
```
if (process.argv[2] && process.argv[2].startsWith('{')) {
		const argv = JSON.parse(process.argv[2]);
		const server = new Hope(argv);
		server.start();
	}
```
测试:
```
npm install hope-server -g
```
进入任意目录
```
hope-server
```


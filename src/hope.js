// const config = require('./config');
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const mime = require('mime');
const chalk = require('chalk');
const util = require('util');
const debug = require('debug')('static:app');
const ejs = require('ejs');
const zlib = require('zlib');
const stat = util.promisify(fs.stat);
const readdir = util.promisify(fs.readdir);
let tmpl = fs.readFileSync(path.join(__dirname,'template.ejs'),'utf8')
class Server {
    constructor (argv) {
        this.config = Object.assign({}, this.config, argv);
        // this.config = config;
        this.tmpl = tmpl;
    }
    handlerRequest () {
        return async (req, res) => {
            // 处理路径
            let { pathname } = url.parse(req.url, true);
            let resource = path.join(this.config.dir, '.' + pathname);
            try {
                let fileObj = await stat(resource);
                console.log(fileObj.isDirectory(), '文件或者目录')
                if (fileObj.isDirectory()) {
                    // 是目录
                    let dirs = await readdir(resource);
                    debug(dirs);
                    // 获取路径名和文件名
                    dirs = dirs.map(dir => ({
                        path: path.join(__dirname, dir),
                        name: dir
                    }));
                    let content = ejs.render(this.tmpl, {dirs});
                    res.setHeader('Content-Type', 'text/html;charset=utf8');
                    res.end(content);
                } else {
                    // 是文件
                    this.sendFile(req, res, resource, fileObj);
                }
            } catch (e) {
                this.sendError(req, res, e);
            }
        }
    }
    cache (req, res, statObj) {
        // ifNoneMatch一般是内容的md5戳 => ctime+size
        let ifNoneMatch = req.headers['if-none-match'];
        // ifModifiedSince文件的最新修改时间
        let ifModifiedSince = req.headers['if-modified-since'];
        // 最新修改时间
        let since = statObj.ctime.toUTCString();
        // etag代表服务器文件的一个描述
        let etag = new Date(since).getTime() + '-' + statObj.size;

        // 10秒内强缓存
        res.setHeader('Cache-Control', 'max-age=10');
        res.setHeader('Etag', etag);
        res.setHeader('LastModified', since);
        // 判断etag是否过期
        if (ifNoneMatch && ifNoneMatch !== etag) {
            return false;
        }
        // 判断文件最后修改时间
        if (ifModifiedSince && ifModifiedSince !== since) {
            return false;
        }
        // 如果存在且相等，走缓存304
        if (ifNoneMatch || ifModifiedSince) {
            res.statusCode = 304;
            res.end();
            return true;
        } else {
            return false;
        }
    }
    //启动服务器
    start () {
        let server = http.createServer(this.handlerRequest());
        let { hostname, port } = this.config;
        let url = `http://${hostname}:${chalk.green(port)}`
        debug(url);
        server.listen(port, hostname)
    }
    // 压缩方法
    compress (req, res, p) {
        // 为了兼容不同的浏览器，node把所有的请求头全转成了小写
        let types = req.headers['accept-encoding'];
        console.log(types.match(/\bgzip\b/), 'types')
        if (types) {
            if (types.match(/\bgzip\b/)) {
                res.setHeader('Content-Encoding', 'gzip');
                return zlib.createGzip();
            } else if (types.match(/\bdeflate\b/)) {
                res.setHeader('Content-Encoding', 'deflate');
                return zlib.createDeflate();
            } else {
                return false
            }
        } else {
            return false
        }
    }
    // 范围请求
    range (req, res, statObj) {
        // 范围请求的头: Range: bytes=1-100
        // 服务器 Accept-Ranges:bytes
        // Content-Ranges:1-100/total
        // 测试方法: curl -v --header "Range:bytes=1-3" http://localhost:8000/index.html
        let start = 0;
        let end = statObj.size; // 整个文件大小
        let header = req.headers['range'];
        if (header) {
            res.setHeader('Content-Range','bytes')
            res.setHeader('Accept-Ranges',`bytes ${start}-${end}/${statObj.size}`)
            let result = header.match(/bytes=(\d*)-(\d*)/);
            if (result) {
                start = isNaN(result[1]) ? start : parseInt(result[1]);
                end = isNaN(result[2]) ? end : parseInt(result[2]);
            }
            return {start, end: end - 1}
        }
    }
    // 发送文件
    sendFile (req, res, p, statObj) {
        if (this.cache(req, res, statObj)) return
        // 压缩
        const s = this.compress(req, res, p);
        res.setHeader('Content-type', mime.getType(p) + ';charset=utf8');
        // 范围请求
        let { start, end } = this.range(req, res, statObj);
        console.log(start, end)
        let rs = fs.createReadStream(p, {start, end});
        if (s) {
            // 可以压缩
            rs.pipe(s).pipe(res)
        } else {
            // 直接返回
            rs.pipe(res)
        }
    }
    // 发送错误信息
    sendError (req, res, err) {
        debug(util.inspect(err).toString())
        res.statusCode = 404;
        res.end()
    }
}
if (process.argv[2] && process.argv[2].startsWith('{')) {
    const argv = JSON.parse(process.argv[2]);
    const server = new Server(argv);
    server.start();
}
// var server = new Server();
// server.start();
module.exports = Server;

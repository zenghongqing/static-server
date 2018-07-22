const path = require('path');

let config = {
    host: '127.0.0.1',
    port: 8000,
    dir: path.join(__dirname, '..', 'public'),
    ejsDir: path.join(__dirname, '..', 'view')
}

module.exports = config
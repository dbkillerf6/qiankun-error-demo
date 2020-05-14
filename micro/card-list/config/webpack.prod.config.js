process.env.NODE_ENV = 'production';

const factory = require('./webpack.config');

module.exports = factory('production');

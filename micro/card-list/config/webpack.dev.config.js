process.env.NODE_ENV = 'development';

const factory = require('./webpack.config');

module.exports = factory('development');

/**
 * @file 异步请求处理middleware
 * @author lyf
 * @date 2015/12/25
 */

'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _genesis2 = require('./genesis');

var _genesis3 = _interopRequireDefault(_genesis2);

var _trader = require('./trader');

var _trader2 = _interopRequireDefault(_trader);

var _terminator2 = require('./terminator');

var _terminator3 = _interopRequireDefault(_terminator2);

var options = {
  pendingStack: []
};

var _utils = require('./utils');

exports.$inject = _utils.$inject;
exports['default'] = {
  genesis: _genesis3['default'](options),
  trader: _trader2['default'],
  terminator: _terminator3['default'](options)
};
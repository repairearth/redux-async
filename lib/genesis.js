/**
 * @file
 * @author lyf
* @date 2015/12/25
*/

'use strict';

exports.__esModule = true;

var _utils = require('./utils');

/**
 * meta.showLoading {boolean} @default [true] if payload is a promise
 * meta.onLoad {function} deal with yourself
 * @param dispatch
 */
var RECEIVE_LOADING_STATE = 'RECEIVE_LOADING_STATE';

exports['default'] = function (_ref) {
  var pendingStack = _ref.pendingStack;
  return function (_ref2) {
    var dispatch = _ref2.dispatch;
    return function (next) {
      return function (action) {
        var _action$meta = action.meta;
        var meta = _action$meta === undefined ? {} : _action$meta;
        var _action$payload = action.payload;
        var payload = _action$payload === undefined ? {} : _action$payload;

        if (_utils.isPromise(payload) || _utils.hasPromiseProps(payload)) {
          action[_utils.isAsync] = true;
          var isShowLoading = pendingStack.length === 0 && meta.showLoading !== false;

          if (isShowLoading) {
            pendingStack.push(action.type);
            dispatch({
              type: RECEIVE_LOADING_STATE,
              payload: true
            });
          }
        }

        return next(action);
      };
    };
  };
};

module.exports = exports['default'];
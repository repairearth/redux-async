/**
 * @file
 * @author lyf
* @date 2015/12/25
*/

'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _utils = require('./utils');

/**
 * meta.showLoading {boolean} @default [true] if payload is a promise
 * meta.onLoad {function} deal with yourself
 * @param dispatch
 */
var RECEIVE_LOADING_STATE = 'RECEIVE_LOADING_STATE';

exports['default'] = function (_ref) {
  var loadingStack = _ref.loadingStack;
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
          var isShowLoading = loadingStack.length === 0 && meta.showLoading !== false;
          var isDispatchPending = meta.dispatchPending === true;

          if (isShowLoading) {
            loadingStack.push(action.type);
            dispatch({
              type: RECEIVE_LOADING_STATE,
              payload: true
            });
          }

          if (isDispatchPending) {
            (function () {
              var payload = action.payload;

              var newPayload = {};

              if (!_utils.isPromise(payload)) {
                // remove promise property
                newPayload = _extends({}, payload);
                Object.keys(newPayload).forEach(function (key) {
                  if (_utils.isPromise(newPayload[key]) || _utils.hasDeps(newPayload[key])) {
                    delete newPayload[key];
                  }
                });
              }

              dispatch({
                type: action.type + '-' + _utils.ACTION_PENDING,
                payload: newPayload,
                meta: action.meta
              });
            })();
          }
        }

        return next(action);
      };
    };
  };
};

module.exports = exports['default'];
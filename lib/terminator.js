/**
 * @file
 * @author lyf
 * @date 2015/12/25
 */

'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _utils = require('./utils');

var RECEIVE_GLOBAL_MESSAGE = 'RECEIVE_GLOBAL_MESSAGE';
var RECEIVE_LOADING_STATE = 'RECEIVE_LOADING_STATE';
var createGlobalMessage = function createGlobalMessage(type, message, originData) {
  return { type: type, message: message, originData: originData };
};

var transformResponse = function transformResponse(response) {

  if (Array.isArray(response)) {
    response = [].concat(response);
    return response.map(function (item) {
      return _utils.isAxiosResponse(item) ? item.data : item;
    });
  }

  if (_utils.isAxiosResponse(response)) {
    return response.data;
  }

  response = _extends({}, response);

  Object.keys(response).forEach(function (prop) {
    if (_utils.isAxiosResponse(response[prop])) {
      response[prop] = response[prop].data;
    }
  });

  return response;
};

/**
 * @param data {object|array}
 * @returns {string}
 */
var getErrorMessage = function getErrorMessage(data) {
  var response = [].concat(data);
  var errorMessage = '';

  response.some(function (item) {
    if (_utils.isUCErrorResponse(item)) {
      errorMessage = item.message;
      return true;
    }
    return Object.keys(item).some(function (prop) {
      if (_utils.isUCErrorResponse(item[prop])) {
        errorMessage = item[prop].message;
        return true;
      }
    });
  });

  return errorMessage;
};

var dispatchGlobalMessage = function dispatchGlobalMessage(dispatch, data) {
  dispatch({
    type: RECEIVE_GLOBAL_MESSAGE,
    payload: data
  });
};

/**
 * meta.error {object} - {text: '', handler(data) {}}
 * meta.success {object} - {text: '', handler(data) {}}
 * meta.always {function}
 * @param dispatch
 */

exports['default'] = function (_ref) {
  var pendingStack = _ref.pendingStack;
  return function (_ref2) {
    var dispatch = _ref2.dispatch;
    return function (next) {
      return function (action) {
        var type = action.type;
        var _action$meta = action.meta;
        var meta = _action$meta === undefined ? {} : _action$meta;
        var _action$payload = action.payload;
        var payload = _action$payload === undefined ? {} : _action$payload;

        if ([RECEIVE_GLOBAL_MESSAGE, RECEIVE_LOADING_STATE].indexOf(type) !== -1) {
          return next(action);
        }

        var result = next(action);

        // ------------全局loading处理---------------
        var idx = pendingStack.indexOf(action.type);

        if (idx !== -1) {
          pendingStack.splice(idx, 1);

          if (pendingStack.length === 0) {
            // loading完成，设置loading状态为false
            dispatch({
              type: RECEIVE_LOADING_STATE,
              payload: false
            });
          }
        }

        // --------- 全局消息处理（错误，成功）-------------
        var response = transformResponse(payload);
        var _meta$success = meta.success;
        var success = _meta$success === undefined ? {} : _meta$success;
        var _meta$error = meta.error;
        var error = _meta$error === undefined ? {} : _meta$error;
        var always = meta.always;

        if (action.error) {
          var text = error.text;
          var handler = error.handler;

          var errorMessage = text || getErrorMessage(response);

          dispatchGlobalMessage(dispatch, createGlobalMessage('error', errorMessage));
          _utils.isFn(handler) && handler(response);
        } else {
          var text = success.text;
          var handler = success.handler;

          text && dispatchGlobalMessage(dispatch, createGlobalMessage('success', text));
          _utils.isFn(handler) && handler(response);
        }

        _utils.isFn(always) && always(action);

        return result;
      };
    };
  };
};

module.exports = exports['default'];
/**
 * @file
 * @author lyf
 * @date 2015/12/25
 */

'use strict';

exports.__esModule = true;

var _utils = require('./utils');

var RECEIVE_GLOBAL_MESSAGE = 'RECEIVE_GLOBAL_MESSAGE';
var RECEIVE_LOADING_STATE = 'RECEIVE_LOADING_STATE';
var createGlobalMessage = function createGlobalMessage(type, message, originData) {
  return { type: type, message: message, originData: originData };
};

var transformResponse = function transformResponse(response) {

  if (Array.isArray(response)) {
    return response.map(function (item) {
      return _utils.isCommonAxiosResponse(item) ? item.data : item;
    });
  }
  if (_utils.isCommonAxiosResponse(response)) {
    return response.data;
  }

  Object.keys(response).forEach(function (prop) {
    if (_utils.isCommonAxiosResponse(response[prop])) {
      response[prop] = response[prop].data;
    }
  });

  return response;
};

var getErrorMessage = function getErrorMessage(data) {
  var response = [].concat(data);
  var errorMessage = '';

  response.some(function (item) {
    if (_utils.isCommonAxiosResponse(item)) {
      var _status = item.status;
      var _data = item.data;

      var isSuccess = _status >= 200 && _status < 300 || _status === 304;
      if (!isSuccess) {
        errorMessage = _data.message;
        return true;
      }
    }
    if (_utils.isUCErrorResponse(item)) {
      errorMessage = item.message;
      return true;
    }
  });

  return errorMessage;
};

/**
 * meta.error {string|function}
 * meta.success {string|function}
 * meta.always {function}
 * @param dispatch
 */

exports['default'] = function (_ref) {
  var pendingStack = _ref.pendingStack;
  return function (_ref2) {
    var dispatch = _ref2.dispatch;
    return function (next) {
      return function (action) {
        var isError = action.error;
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
        var isShowGlobalMessage = undefined;

        if (isError) {
          var errorMessage = getErrorMessage(payload);

          if (_utils.isFunc(meta.error)) {
            meta.error(response);
          } else {
            isShowGlobalMessage = true;
            response = createGlobalMessage('error', meta.error || errorMessage, response);
          }
        } else if (meta.success) {
          if (_utils.isFunc(meta.success)) {
            meta.success(response);
          } else {
            isShowGlobalMessage = true;
            response = createGlobalMessage('success', meta.success, response);
          }
        }

        if (isShowGlobalMessage) {
          dispatch({
            type: RECEIVE_GLOBAL_MESSAGE,
            payload: response
          });
        }

        // 本来想用finally，怕关键字会有问题，先这样吧
        _utils.isFunc(meta.always) && meta.always(response);

        return result;
      };
    };
  };
};

module.exports = exports['default'];
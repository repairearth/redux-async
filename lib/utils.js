/**
 * @file
 * @author lyf
 * @date 2015/12/25
 */

'use strict';

exports.__esModule = true;
var API_REQUEST_ERROR = 'API_REQUEST_ERROR';
exports.API_REQUEST_ERROR = API_REQUEST_ERROR;
var isFunc = function isFunc(arg) {
  return typeof arg === 'function';
};
exports.isFunc = isFunc;
var isObject = function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
};
exports.isObject = isObject;
var isPromise = function isPromise(obj) {
  return obj && typeof obj.then === 'function';
};
exports.isPromise = isPromise;
var hasPromiseProps = function hasPromiseProps(obj) {
  return obj && Object.keys(obj).some(function (key) {
    return isPromise(obj[key]);
  });
};

exports.hasPromiseProps = hasPromiseProps;
var getDeps = function getDeps(func) {
  if (isFunc(func)) {
    return func.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1].replace(/ /g, '').split(',');
  }
  return null;
};

exports.getDeps = getDeps;
var hasDeps = function hasDeps(func) {
  return getDeps(func) !== null;
};

exports.hasDeps = hasDeps;
var inject = function inject(func, payload) {
  if (!isFunc(func) || !hasDeps(func)) return func;
  return func.apply(null, getDeps(func).map(function (name) {
    return payload[name];
  }));
};

exports.inject = inject;
var isCommonAxiosResponse = function isCommonAxiosResponse(response) {
  return isObject(response) && ['data', 'status', 'statusText', 'headers', 'config'].every(function (key) {
    return key in response;
  });
};

exports.isCommonAxiosResponse = isCommonAxiosResponse;
var isUCErrorResponse = function isUCErrorResponse(response) {
  return isObject(response) && ['code', 'host_id', 'message', 'request_id', 'server_time'].every(function (key) {
    return key in response;
  });
};

exports.isUCErrorResponse = isUCErrorResponse;
/**
 * 简化版Promise.all
 * 与原生的区别是，不管有没有error, 都返回完整的数据
 * @param arr {Array} promise数组
 * @returns {Promise}
 */
var PromiseAll = function PromiseAll(arr) {
  var args = Array.prototype.slice.call(arr);

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([]);

    var remaining = args.length;
    var isError = false;

    var callback = function callback(i, error) {
      return function (res) {
        if (error) {
          isError = true;
          res[API_REQUEST_ERROR] = true;
        }

        args[i] = res;

        if (--remaining === 0) {
          isError ? reject(args) : resolve(args);
        }
      };
    };

    args.forEach(function (val, i) {
      if (typeof val.then === 'function') {
        val.then(callback(i), callback(i, true));
      } else {
        callback(i)(val);
      }
    });
  });
};
exports.PromiseAll = PromiseAll;
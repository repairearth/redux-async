/**
 * @file
 * @author lyf
 * @date 2015/12/25
 */

'use strict';

exports.__esModule = true;
var API_REQUEST_ERROR = 'API_REQUEST_ERROR';
exports.API_REQUEST_ERROR = API_REQUEST_ERROR;
var isFn = function isFn(arg) {
  return typeof arg === 'function';
};
exports.isFn = isFn;
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
    return isPromise(obj[key]) || hasDeps(obj[key]);
  });
};

exports.hasPromiseProps = hasPromiseProps;
var $inject = function $inject(fn) {
  return function () {
    for (var _len = arguments.length, deps = Array(_len), _key = 0; _key < _len; _key++) {
      deps[_key] = arguments[_key];
    }

    if (isFn(fn) && deps.length) {
      fn.deps = deps;
    }
    return fn;
  };
};

exports.$inject = $inject;
var getDeps = function getDeps(fn) {
  if (isFn(fn)) {
    // return func.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1].replace(/ /g, '').split(',');
    return fn.deps;
  }
  return null;
};

exports.getDeps = getDeps;
var hasDeps = function hasDeps(fn) {
  return getDeps(fn) !== null;
};

exports.hasDeps = hasDeps;
var execute = function execute(fn, payload) {
  if (!isFn(fn) || !hasDeps(fn)) return fn;
  return fn.apply(null, getDeps(fn).map(function (name) {
    return payload[name];
  }));
};

exports.execute = execute;
var isAxiosResponse = function isAxiosResponse(response) {
  return isObject(response) && ['data', 'status', 'statusText', 'headers', 'config'].every(function (key) {
    return key in response;
  });
};

exports.isAxiosResponse = isAxiosResponse;
var isErrorResponse = function isErrorResponse(response) {
  return isObject(response) && ['code', 'host_id', 'message', 'request_id', 'server_time'].every(function (key) {
    return key in response;
  });
};

exports.isErrorResponse = isErrorResponse;
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
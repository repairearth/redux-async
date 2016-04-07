/**
 * @file async actions trader
 * @author lyf
 * @date 2015/12/25
 */

'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

exports['default'] = function (store) {
  return function (next) {
    return function (action) {
      try {
        var payload = action.payload;

        if (utils.isPromise(payload)) {
          return payload.then(function (result) {
            return next(_extends({}, action, { payload: result }));
          }, function (error) {
            return next(_extends({}, action, { payload: error, error: true }));
          });
        } else if (utils.hasPromiseProps(payload)) {
          return process(action, next);
        } else {
          return next(action);
        }
      } catch (error) {
        console && console.log(error);
      }
    };
  };
};

/**
 * 构造请求队列
 * @param payload
 */
var buildResolvedQueue = function buildResolvedQueue(payload) {
  var props = Object.keys(payload);
  var resolvedProps = props.filter(function (key) {
    return !utils.hasDeps(payload[key]);
  });
  var resolvedQueue = [getNonDependenciesProps(payload)]; // 没有依赖的最先处理

  function parseDependencies() {
    var _again = true;

    _function: while (_again) {
      _again = false;

      var dependenciesProps = props.filter(function (key) {
        return resolvedProps.indexOf(key) === -1;
      });
      if (!dependenciesProps.length) return;

      var nextProps = undefined;

      dependenciesProps.forEach(function (prop) {
        var isAllDepsResolved = utils.getDeps(payload[prop]).every(function (dep) {
          return resolvedProps.indexOf(dep) !== -1 || !(dep in payload);
        });
        if (isAllDepsResolved) {
          nextProps = nextProps || {};
          nextProps[prop] = payload[prop];
        }
      });

      if (nextProps) {
        resolvedQueue.push(nextProps);
        resolvedProps.push.apply(resolvedProps, Object.keys(nextProps));
      }

      _again = true;
      dependenciesProps = nextProps = undefined;
      continue _function;
    }
  }

  parseDependencies();

  return resolvedQueue;
};

var getNonDependenciesProps = function getNonDependenciesProps(obj) {
  return Object.keys(obj).filter(function (key) {
    return !utils.hasDeps(obj[key]);
  }).reduce(function (acc, key) {
    acc[key] = obj[key];
    return acc;
  }, {});
};

var process = function process(action, next) {
  var payload = action.payload;
  var _action$meta = action.meta;
  var meta = _action$meta === undefined ? {} : _action$meta;

  var resolvedQueue = buildResolvedQueue(payload);
  var currentResolvedProps = undefined;

  resolvedQueue.reduce(function (acc, obj) {
    return acc.then(function () {
      return resolveProps(obj);
    });
  }, Promise.resolve(true)).then(function (result) {
    return next(action);
  })['catch'](function (error) {
    resolver(currentResolvedProps)(error);
    return next(_extends({}, action, { error: true }));
  });

  var resolveProps = function resolveProps(obj) {
    var props = Object.keys(obj);
    var values = props.map(function (prop) {
      return utils.execute(obj[prop], payload);
    });

    currentResolvedProps = props;

    return utils.PromiseAll(values).then(resolver(props));
  };

  var resolver = function resolver(props) {
    return function (resolvedArray) {
      return props.reduce(function (acc, prop, index) {
        var result = resolvedArray[index];

        if (meta[prop]) {
          // onSuccess, onError handle if there is.
          var _meta$prop = meta[prop];
          var onSuccess = _meta$prop.onSuccess;
          var onError = _meta$prop.onError;

          if (result[utils.API_REQUEST_ERROR]) {
            onError && onError(result);
          } else {
            onSuccess && onSuccess(result);
          }
        }

        delete result[utils.API_REQUEST_ERROR]; // delete non-used property
        payload[prop] = result;

        return payload;
      }, null);
    };
  };
};
module.exports = exports['default'];
/**
 * @file async actions trader
 * @author lyf
 * @date 2015/12/25
 */

import * as utils from './utils'

export default store => next => action => {
  const { payload } = action;

  if (utils.isPromise(payload)) {
    return payload.then(
      result => next({...action, payload: result}),
      error => next({...action, payload: error, error: true})
    );
  } else if (utils.hasPromiseProps(payload)) {
    return process(action, next);
  } else {
    return next(action);
  }
}

/**
 * 构造请求队列
 * @param payload
 */
const buildResolvedQueue = payload => {
  const props = Object.keys(payload);
  let resolvedProps = props.filter(key => !utils.hasDeps(payload[key]));
  let resolvedQueue = [getNonDependenciesProps(payload)]; // 没有依赖的最先处理

  function parseDependencies() {
    let dependenciesProps = props.filter(key => resolvedProps.indexOf(key) === -1);
    if (!dependenciesProps.length) return;

    let nextProps;

    dependenciesProps.forEach(prop => {
      let isAllDepsResolved = utils.getDeps(payload[prop]).every(dep => resolvedProps.indexOf(dep) !== -1 || !(dep in payload));
      if (isAllDepsResolved) {
        nextProps = nextProps || {};
        nextProps[prop] = payload[prop];
      }
    });

    if (nextProps) {
      resolvedQueue.push(nextProps);
      resolvedProps.push(...Object.keys(nextProps));
    }

    return parseDependencies();
  }

  parseDependencies();

  return resolvedQueue;
};

const getNonDependenciesProps = obj => {
  return Object.keys(obj).filter(key => !utils.hasDeps(obj[key])).reduce((acc, key) => {
    acc[key] = obj[key];
    return acc;
  }, {});
};

const process = (action, next) => {
  let { payload, meta={} } = action;
  let resolvedQueue = buildResolvedQueue(payload);
  let currentResolvedProps;

  resolvedQueue.reduce((acc, obj)  => {
      return acc.then(() => resolveProps(obj));
    }, Promise.resolve(true))
    .then(result => next(action))
    .catch(error => {
      resolver(currentResolvedProps)(error);
      return next({...action, error: true})
    });

  const resolveProps = (obj) => {
    let props = Object.keys(obj);
    let values = props.map(prop => utils.execute(obj[prop], payload));

    currentResolvedProps = props;

    return utils.PromiseAll(values).then(resolver(props));
  };

  const resolver = props => resolvedArray => {
    return props.reduce((acc, prop, index) => {
      let result = resolvedArray[index];

      if (meta[prop]) {
        // onSuccess, onError handle if there is.
        let { onSuccess, onError } = meta[prop];

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

/**
 * @file async actions trader
 * @author lyf
 * @date 2015/12/25
 */

import * as utils from './utils'

const process = (action, next) => {
  const { payload, meta={} } = action;
  const returnPureData = meta.returnPureData !== false; // default true;

  let resolved = resolveProps(getNonDependenciesProps(payload));

  resolved.then(
    result => next({...action, payload: utils.getResult(result, returnPureData)}),
    error => next({...action, payload: utils.getResult(error, returnPureData), error: true})
  )
};

const resolveProps = obj => {
  const props = Object.keys(obj);
  const values = props.map(prop => obj[prop]);

  return Promise.all(values).then(resolvedArray => {
    return props.reduce((acc, prop, index) => {
      acc[prop] = resolvedArray[index];
      return acc;
    }, {});
  });
};

const getNonDependenciesProps = obj => {
  return Object.keys(obj).filter(key => !utils.hasDeps(key)).reduce((acc, key) => {
    acc[key] = obj[key];
    return acc;
  }, {});
};

export default ({dispatch}) => next => action => {
  const { payload, meta={} } = action;
  const returnPureData = meta.returnPureData !== false; // default true;

  if (utils.isPromise(payload)) {
    return payload.then(
      result => next({...action, payload: utils.getResult(result, returnPureData)}),
      error => next({...action, payload: utils.getResult(error, returnPureData), error: true})
    );
  } else if (utils.hasPromiseProps(payload)) {
    return process(action);
  } else {
    return next(action);
  }
}

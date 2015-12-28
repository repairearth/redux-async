/**
 * @file
 * @author lyf
 * @date 2015/12/25
 */

const RECEIVE_LOADING_STATE = 'RECEIVE_LOADING_STATE';
const isFunc = arg => typeof arg === 'function';
const isPromise = val => val && typeof val.then === 'function';

/**
 * meta.showLoading {boolean} @default [true] if payload is a promise
 * meta.onLoad {function} deal with yourself
 * @param dispatch
 */
export default ({pendingStack}) => ({dispatch}) => next => action => {
  let { meta = {}, payload = {}, ignore } = action;

  if (ignore) return next(action); // 系统级别的action，自动忽略

  if (isPromise(action.payload)) {
    const isShowLoading = pendingStack.length === 0 && meta.showLoading !== false && !meta.onLoad;

    if (isShowLoading) {
      dispatch({
        type: RECEIVE_LOADING_STATE,
        payload: true,
        ignore: true
      })
    }

    pendingStack.push(action.type);
    dispatch({
      type: `${action.type}_PENDING`,
      ignore: true
    });
  }

  isFunc(meta.onLoad) && meta.onLoad();

  return next(action);
}
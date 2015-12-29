/**
 * @file
 * @author lyf
 * @date 2015/12/25
 */

import { isFunc, isCommonAxiosResponse, isUCErrorResponse } from './utils'

const RECEIVE_GLOBAL_MESSAGE = 'RECEIVE_GLOBAL_MESSAGE';
const RECEIVE_LOADING_STATE = 'RECEIVE_LOADING_STATE';
const createGlobalMessage = (type, message, originData) => ({type, message, originData});

const transformResponse = response => {

  if (Array.isArray(response)) {
    return response.map(item => isCommonAxiosResponse(item) ? item.data : item);
  }
  if (isCommonAxiosResponse(response)) {
    return response.data;
  }

  Object.keys(response).forEach(prop => {
    if (isCommonAxiosResponse(response[prop])) {
      response[prop] = response[prop].data;
    }
  });

  return response;
};

const getErrorMessage = data => {
  let response = [].concat(data);
  let errorMessage = '';

  response.some(item => {
    if (isCommonAxiosResponse(item)) {
      const { status, data } = item;
      const isSuccess = status >= 200 && status < 300 || status === 304;
      if (!isSuccess) {
        errorMessage = data.message;
        return true;
      }
    }
    if (isUCErrorResponse(item)) {
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
export default ({pendingStack}) => ({dispatch}) => next => action => {
  const isError = action.error;
  let { type, meta = {}, payload = {} } = action;

  if ([RECEIVE_GLOBAL_MESSAGE, RECEIVE_LOADING_STATE].indexOf(type) !== -1) {
    return next(action);
  }

  const result = next(action);

  // ------------全局loading处理---------------
  const idx = pendingStack.indexOf(action.type);

  if (idx !== -1) {
    pendingStack.splice(idx, 1);

    if (pendingStack.length === 0) { // loading完成，设置loading状态为false
      dispatch({
        type: RECEIVE_LOADING_STATE,
        payload: false
      })
    }
  }

  // --------- 全局消息处理（错误，成功）-------------
  let response = transformResponse(payload);
  let isShowGlobalMessage;

  if (isError) {
    let errorMessage = getErrorMessage(payload);

    if (isFunc(meta.error)) {
      meta.error(response);
    } else {
      isShowGlobalMessage = true;
      response = createGlobalMessage('error', meta.error || errorMessage, response);
    }
  } else if (meta.success) {
    if (isFunc(meta.success)) {
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
    })
  }

  // 本来想用finally，怕关键字会有问题，先这样吧
  isFunc(meta.always) && meta.always(response);

  return result;
}
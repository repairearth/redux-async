/**
 * @file
 * @author lyf
 * @date 2015/12/25
 */

import { isFn, isAxiosResponse, isUCErrorResponse } from './utils'

const RECEIVE_GLOBAL_MESSAGE = 'RECEIVE_GLOBAL_MESSAGE';
const RECEIVE_LOADING_STATE = 'RECEIVE_LOADING_STATE';
const createGlobalMessage = (type, message, originData) => ({type, message, originData});

const transformResponse = response => {

  if (Array.isArray(response)) {
    response = [...response];
    return response.map(item => isAxiosResponse(item) ? item.data : item);
  }

  if (isAxiosResponse(response)) {
    return response.data;
  }

  response = {...response};

  Object.keys(response).forEach(prop => {
    if (isAxiosResponse(response[prop])) {
      response[prop] = response[prop].data;
    }
  });

  return response;
};

/**
 * @param data {object|array}
 * @returns {string}
 */
const getErrorMessage = data => {
  let response = [].concat(data);
  let errorMessage = '';

  response.some(item => {
    if (isUCErrorResponse(item)) {
      errorMessage = item.message;
      return true;
    }
    return Object.keys(item).some(prop => {
      if (isUCErrorResponse(item[prop])) {
        errorMessage = item[prop].message;
        return true;
      }
    })
  });

  return errorMessage;
};

const dispatchGlobalMessage = (dispatch, data) => {
  dispatch({
    type: RECEIVE_GLOBAL_MESSAGE,
    payload: data
  })
}

/**
 * meta.error {object} - {text: '', handler(data) {}}
 * meta.success {object} - {text: '', handler(data) {}}
 * meta.always {function}
 * @param dispatch
 */
export default ({pendingStack}) => ({dispatch}) => next => action => {
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
  const { success={}, error={}, always } = meta;

  if (action.error) {
    let { text, handler } = error;
    let errorMessage = text || getErrorMessage(response);

    dispatchGlobalMessage(dispatch, createGlobalMessage('error', errorMessage));
    isFn(handler) && handler(response);
  } else {
    let { text, handler } = success;

    text && dispatchGlobalMessage(dispatch, createGlobalMessage('success', text));
    isFn(handler) && handler(response);
  }

  isFn(always) && always(action);

  return result;
}
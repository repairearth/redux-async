/**
 * @file
 * @author lyf
 * @date 2015/12/25
 */

const RECEIVE_GLOBAL_MESSAGE = 'RECEIVE_GLOBAL_MESSAGE';
const RECEIVE_LOADING_STATE = 'RECEIVE_LOADING_STATE';
const isFunc = (arg) => typeof arg === 'function';
const createGlobalMessage = (type, message, origin) => ({type, message, origin});
const getErrorMessage = data => {
  if (Array.isArray(data)) {
    const errorResponse = data.filter(item => {
      const { status } = item.data;
      const isSuccess = status >= 200 && status < 300 || status === 304;
      return !isSuccess;
    });

    if (errorResponse.length) {
      return errorResponse[0].data.message;
    }
  }

  return data.message;
};

/**
 * meta.error {string|function}
 * meta.success {string|function}
 * meta.always {function}
 * @param dispatch
 */
export default ({pendingStack}) => ({dispatch}) => next => action => {
  const isError = action.error;
  let { meta = {}, payload = {}, ignore } = action;
  let { data } = payload;
  let isShowGlobalMessage;

  if (ignore) return next(action);  // 系统级别的action，自动忽略

  // -----------------------------------------
  const result = next(action);
  // -----------------------------------------

  // ------------全局loading处理---------------
  const idx = pendingStack.indexOf(action.type);

  if (idx !== -1) {
    dispatch({
      type: `${action.type}_FINISH`,
      payload: payload,
      ignore: true
    });
    pendingStack.splice(idx, 1);
  }

  if (pendingStack.length === 0) { // loading完成，设置loading状态为false
    dispatch({
      type: RECEIVE_LOADING_STATE,
      payload: false,
      ignore: true
    })
  }

  // --------- 全局消息处理（错误，成功）-------------
  if (Array.isArray(payload)) {
    data = payload.map(item => item.data);
  }

  if (isError) {
    if (isFunc(meta.error)) {
      meta.error(data);
    } else {
      isShowGlobalMessage = true;
      data = createGlobalMessage('error', meta.error || getErrorMessage(data), data);
    }
  } else if (meta.success) {
    if (isFunc(meta.success)) {
      meta.success(data);
    } else {
      isShowGlobalMessage = true;
      data = createGlobalMessage('success', meta.success, data);
    }
  }

  if (isShowGlobalMessage) {
    // 系统级action, 增加ignore属性
    dispatch({
      type: RECEIVE_GLOBAL_MESSAGE,
      payload: data,
      ignore: true
    })
  }

  // 本来想用finally，怕关键字会有问题，先这样吧
  isFunc(meta.always) && meta.always(action);

  return result;
}
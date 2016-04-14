/**
 * @file
 * @author lyf
* @date 2015/12/25
*/

const RECEIVE_LOADING_STATE = 'RECEIVE_LOADING_STATE'
import { isPromise, hasPromiseProps, isAsync, ACTION_PENDING } from './utils'

/**
 * meta.showLoading {boolean} @default [true] if payload is a promise
 * meta.onLoad {function} deal with yourself
 * @param dispatch
 */
export default ({loadingStack}) => ({dispatch}) => next => action => {
  let { meta = {}, payload = {} } = action

  if (isPromise(payload) || hasPromiseProps(payload)) {
    action[isAsync] = true
    const isShowLoading = loadingStack.length === 0 && meta.showLoading !== false
    const isDispatchPending = meta.dispatchPending === true

    if (isShowLoading) {
      loadingStack.push(action.type)
      dispatch({
        type: RECEIVE_LOADING_STATE,
        payload: true
      })
    }

    if (isDispatchPending) {
      dispatch({
        type: `${action.type}-${ACTION_PENDING}`,
        payload: action.payload,
        meta: action.meta
      })
    }
  }

  return next(action)
}

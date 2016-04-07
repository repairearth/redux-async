/**
 * @file
 * @author lyf
* @date 2015/12/25
*/

const RECEIVE_LOADING_STATE = 'RECEIVE_LOADING_STATE'
import { isPromise, hasPromiseProps, isAsync } from './utils'

/**
 * meta.showLoading {boolean} @default [true] if payload is a promise
 * meta.onLoad {function} deal with yourself
 * @param dispatch
 */
export default ({pendingStack}) => ({dispatch}) => next => action => {
  let { meta = {}, payload = {} } = action

  if (isPromise(payload) || hasPromiseProps(payload)) {
    action[isAsync] = true
    const isShowLoading = pendingStack.length === 0 && meta.showLoading !== false

    if (isShowLoading) {
      pendingStack.push(action.type)
      dispatch({
        type: RECEIVE_LOADING_STATE,
        payload: true
      })
    }
  }

  return next(action)
}

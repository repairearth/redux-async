/**
 * @file
 * @author lyf
 * @date 2015/12/25
 */

import { isFn, isAxiosResponse, isErrorResponse, isAsync} from './utils'

const RECEIVE_GLOBAL_MESSAGE = 'RECEIVE_GLOBAL_MESSAGE'
const RECEIVE_LOADING_STATE = 'RECEIVE_LOADING_STATE'
const createGlobalMessage = (type, message) => ({type, message})

const transformResponse = response => {
  if (response instanceof Error) {
    return response
  }

  if (Array.isArray(response)) {
    response = [...response]
    return response.map(item => isAxiosResponse(item) ? item.data : item)
  }

  if (isAxiosResponse(response)) {
    return response.data
  }

  response = {...response}

  Object.keys(response).forEach(prop => {
    let propResponse = response[prop]

    if (Array.isArray(propResponse)) {
      response[prop] = propResponse.map(item => isAxiosResponse(item) ? item.data : item)
    } else if (isAxiosResponse(propResponse)) {
      response[prop] = propResponse.data
    }
  })

  return response
}

/**
 * @param data {object|array}
 * @returns {string}
 */
const getError = data => {
  let response = [].concat(data)
  let errorObj = {}

  response.some(item => {
    if (isErrorResponse(item)) {
      errorObj = item
      return true
    }
    return Object.keys(item).some(prop => {
      let value = item[prop]

      if (Array.isArray(value)) {
        return value.some(arrItem => {
          if (isErrorResponse(arrItem)) {
            errorObj = arrItem
            return true
          }
        })
      } else if (isErrorResponse(value)) {
        errorObj = value
        return true
      }
    })
  })

  return errorObj
}

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
export default ({loadingStack}) => ({dispatch}) => next => action => {
  let { type, meta = {}, payload = {} } = action

  if ([RECEIVE_GLOBAL_MESSAGE, RECEIVE_LOADING_STATE].indexOf(type) !== -1) {
    return next(action)
  }

  const result = next(action)

  // ------------全局loading处理---------------
  const idx = loadingStack.indexOf(action.type)

  if (idx !== -1) {
    loadingStack.splice(idx, 1)

    if (loadingStack.length === 0) { // loading完成，设置loading状态为false
      dispatch({
        type: RECEIVE_LOADING_STATE,
        payload: false
      })
    }
  }

  if (action[isAsync] !== true) return result

  // --------- 全局消息处理（错误，成功）-------------
  let response = transformResponse(payload)
  const { success = {}, error = {}, always } = meta

  if (action.error) {
    if (error) {
      let { text, handler } = error

      if (text !== null) {
        let error = getError(response)

        error.message = text || error.message
        dispatchGlobalMessage(dispatch, createGlobalMessage('error', error))
      }

      isFn(handler) && handler(response)
    }
  } else {
    let { text, handler } = success

    text && dispatchGlobalMessage(dispatch, createGlobalMessage('success', text))
    isFn(handler) && handler(response)
  }

  isFn(always) && always(action)

  return result
}

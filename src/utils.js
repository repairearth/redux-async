/**
 * @file
 * @author lyf
 * @date 2015/12/25
 */

export const API_REQUEST_ERROR = 'API_REQUEST_ERROR'
export const ACTION_PENDING = 'PENDING'
export const isAsync = 'IS_API_REQUEST_ASYNC'
export const isFn = arg => typeof arg === 'function'
export const isObject = obj => Object.prototype.toString.call(obj) === '[object Object]'
export const isPromise = obj => obj && typeof obj.then === 'function'
export const hasPromiseProps = obj => isObject(obj) && Object.keys(obj).some(key => isPromise(obj[key]) || hasDeps(obj[key]))

export const $inject = fn => (...deps) => {
  if (isFn(fn) && deps.length) {
    fn.$deps = deps
  }
  return fn
}

export const getDeps = fn => {
  if (isFn(fn)) {
    return fn.$deps || fn.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1].replace(/ /g, '').split(',')
  }
  return null
}

export const hasDeps = fn => getDeps(fn) !== null

export const execute = (fn, payload) => {
  if (!isFn(fn) || !hasDeps(fn)) return fn
  return fn.apply(null, getDeps(fn).map(name => payload[name]))
}

export const isAxiosResponse = response => {
  return isObject(response) && ['data', 'status', 'statusText', 'headers', 'config'].every(key => key in response)
}

export const isErrorResponse = response => {
  return isObject(response) && ['code', 'host_id', 'message', 'request_id', 'server_time'].every(key => key in response)
}

/**
 * 简化版Promise.all
 * 与原生的区别是，不管有没有error, 都返回完整的数据
 * @param arr {Array} promise数组
 * @returns {Promise}
 */
export const PromiseAll = arr => {
  let args = Array.prototype.slice.call(arr)

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([])

    let remaining = args.length
    let isError = false

    const callback = (i, error) => res => {
      if (error) {
        isError = true
        res[API_REQUEST_ERROR] = true
      }

      args[i] = res

      if (--remaining === 0) {
        isError ? reject(args) : resolve(args)
      }
    }

    args.forEach((val, i) => {
      if (typeof val.then === 'function') {
        val.then(callback(i), callback(i, true))
      } else {
        callback(i)(val)
      }
    })
  })
}

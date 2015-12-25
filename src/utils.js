/**
 * @file
 * @author lyf
 * @date 2015/12/25
 */

export const isFunc = arg => typeof arg === 'function';
export const isPromise = obj => obj && typeof obj.then === 'function';
export const hasPromiseProps = obj => Object.keys(obj).some(key => isPromise(obj[key]));

export const getDeps = func => {
  if (isFunc(func)) {
    return func.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1].replace(/ /g, '').split(',');
  }
  return null;
};

export const hasDeps = key => getDeps(key) !== null;

export const inject = (func, payload) => {
  if (!isFunc(func) || !hasDeps(func)) return func;
  return func.apply(null, getDeps(func).map(name => payload[name]));
};

export const getResult = (response, returnPureData) => {
  if (returnPureData !== false) {
    return Array.isArray(response) ? response.map(item => item.data) : response.data;
  }

  return response;
}

/**
 * 简化版Promise.all
 * 与原生的区别是，不管有没有error, 回调都是完整的数据而不是第一个被reject的返回值
 * @param arr {Array} promise数组
 * @returns {Promise}
 */
export const PromiseAll = arr => {
  let args = Array.prototype.slice.call(arr);

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([]);

    let remaining = args.length;
    let isError = false;

    const callback = (i, error) => res => {
      if (error) isError = true;

      args[i] = res;

      if (--remaining === 0) {
        isError ? reject(args) : resolve(args);
      }
    };

    args.forEach((val, i) => {
      if (typeof val.then === 'function') {
        val.then(callback(i), callback(i, true))
      } else {
        callback(i)(val);
      }
    });
  });
};
redux-async-promise
=============

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Downloads][downloads-image]][downloads-url]

[RSA](https://github.com/kolodny/redux-standard-action)-compliant actions which resolve when any prop is a promise [middleware](https://github.com/gaearon/redux/blob/master/docs/middleware.md) for Redux.


## Install

```js
npm install redux-async-promise --save
```

## Adding as middleware

```js
import async from 'redux-async-promise';
let createStoreWithMiddleware = applyMiddleware(
  async,
)(createStore);
```

## Usage

```js
// action-creators.js
import { $inject } from 'redux-async-promise';

export var fetchXxxxx = createAction('Xxxx',
  // payload
  options => ({
    propA: new ModelA.GET(), // a promise
    propB: new ModelB.GET(), // a promise

    propC: (propB, propA) => {
      // 依赖propA, propB，顺序自己定，参数名跟上面要保持一致，否则是undefined
      // 这个最好提出一个单独的函数，比如 function getPropC (propA, propB) {}
      // 然后 propC: (propA, PropB) => getPropC(propA, propB)
      console.log(propA, propB);
      return new ModelC.GET()
    },
    propD: propC => Promise.resolve(propC)
    
    // uglifyjs压缩导致依赖丢失的，可以使用$inject来显示注入参数
    propE: $inject(getPropE)('propD')
  }),

  // meta
  options => ({
    propA: {
      // 单个请求success, error处理
      onSuccess(data) {},
      onError(data) {}
    },
    propB: {
      onSuccess(data) {},
      onError(data) {}
    },

    // 最终结果success, error处理
    success: 'xxxx', // 字符串或者函数 success(data) {}
    error: 'xxx',    // 字符串或者函数 success(data) {},
    always(data) {}
  })
)

function getPropE(propD) {
  return Promise.resolve(propD)
}

```


[npm-image]: https://img.shields.io/npm/v/redux-async-promise.svg?style=flat-square
[npm-url]: https://npmjs.org/package/redux-async-promise
[travis-image]: https://img.shields.io/travis/symbiont-io/redux-async-promise.svg?style=flat-square
[travis-url]: https://travis-ci.org/symbiont-io/redux-async-promise
[coveralls-image]: https://img.shields.io/coveralls/kolodny/redux-async-promise.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/kolodny/redux-async-promise
[downloads-image]: http://img.shields.io/npm/dm/redux-async-promise.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/redux-async-promise

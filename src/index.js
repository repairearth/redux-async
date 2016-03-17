/**
 * @file 异步请求处理middleware
 * @author lyf
 * @date 2015/12/25
 */

import _genesis from './genesis'
import trader from './trader'
import _terminator from './terminator'

let options = {
  pendingStack: []
}

export { $inject } from './utils'

export default {
  genesis: _genesis(options),
  trader,
  terminator: _terminator(options)
}

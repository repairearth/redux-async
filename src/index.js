/**
 * @file 异步请求处理middleware
 * @author lyf
 * @date 2015/12/25
 */

import _genesis from './genesis'
import trader from './trader'
import _terminator from './terminator'

let options = {
  loadingStack: []
}

export { $inject } from './utils'
export const genesis = _genesis(options)
export const terminator = _terminator(options)
export default trader

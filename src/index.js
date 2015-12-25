/**
 * @file 异步请求处理middleware
 * @author lyf
 * @date 2015/12/25
 */

import _genesis from './genesis'
import _trader from './trader'
import _terminator from './terminator'

let options = {
  pendingStack: []
}

export var genesis = _genesis(options)
export var trader = _trader
export var terminator = _terminator(options)
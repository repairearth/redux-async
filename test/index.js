import expect from 'expect';
import { createStore, applyMiddleware } from 'redux';

import async from '../src';

const getNewStore = (saveAction) => {
  const reducer = function (state, action) {
    if (saveAction) saveAction.action = action;
    return action;
  }
  const store = applyMiddleware(async)(createStore)(reducer);
  return store;
};


describe('redux-async', () => {

  it('handles a normal case', (done) => {
    const randomData = {randomData: Math.random()};
    const store = getNewStore();
    store.subscribe(() => {
      expect(store.getState()).toEqual({type: 'SOMETHING_RESOLVED', payload: randomData});
      done();
    });
    store.dispatch({type: 'SOMETHING_RESOLVED', payload: randomData});
  });

  it('handles a promise as payload', (done) => {
    const store = getNewStore();
    store.subscribe(() => {
      expect(store.getState()).toEqual({type: 'A_PROMISE_AS_PAYLOAD', payload: true});
      done();
    });
    store.dispatch({
      type: 'A_PROMISE_AS_PAYLOAD',
      payload: Promise.resolve(true)
    });
  });

  it('handles a single async request', (done) => {
    const store = getNewStore();
    store.subscribe(() => {
      const state = store.getState();
      expect(state.payload).toEqual({a: 1, b: 2});
      done();
    });
    store.dispatch({
      type: 'SINGLE_ASYNC_REQUEST',
      payload: {
        a: Promise.resolve(1),
        b: 2
      }
    });
  });

  it('handles multi async requests with dependencies', (done) => {
    const store = getNewStore();
    let depA, depB;
    store.subscribe(() => {
      const state = store.getState();
      expect(state.payload).toEqual({a: 1, b: 2, c: 3});
      expect(depA).toBe(1);
      expect(depB).toBe(2);
      done();
    });
    store.dispatch({
      type: 'PAYLOAD_OF_MULTI_REQUEST',
      payload: {
        a: Promise.resolve(1),
        b: Promise.resolve(2),
        c: (a, b) => {
          (depA = a, depB = b);
          return Promise.resolve(3)
        }
      }
    });
  });

  it('handles much more complex requests', (done) => {
    const store = getNewStore();
    let depA, depB, depDA, depDB, depDC;
    store.subscribe(() => {
      const state = store.getState();
      expect(state.payload).toEqual({a: 1, b: 2, c: 3, d: 4});
      expect(depA).toBe(1);
      expect(depB).toBe(2);
      expect(depDA).toBe(1);
      expect(depDB).toBe(2);
      expect(depDC).toBe(3);
      done();
    });
    store.dispatch({
      type: 'MUCH_MORE_COMPLEX_REQUESTS',
      payload: {
        a: Promise.resolve(1),
        b: Promise.resolve(2),
        c: (a, b) => {
          (depA = a, depB = b);
          return Promise.resolve(3);
        },
        d: (c, b, a) => {
          (depDA = a, depDB = b, depDC = c);
          return Promise.resolve(4);
        }
      },
      meta: {
        other: 'other'
      }
    });
  });

  it('handles rejected promise case 1', (done) => {
    const store = getNewStore();
    store.subscribe(() => {
      const state = store.getState();
      expect(state.error).toBeTruthy();
      expect(state.payload.a).toBeAn(Error);
      expect(state.payload.d).toBeAn(Error);
      expect(state.payload.b).toBe('string');
      expect(state.payload.c).toBe(100);
      expect(state.payload.a.message).toEqual('something went wrong');
      expect(state.payload.e).toBeA(Function);
      expect(state.payload.f).toBeA(Function);
      done();
    });
    store.dispatch({
      type: 'REJECTED_PROMISE_CASE',
      payload: {
        a: Promise.reject(new Error('something went wrong')),
        b: 'string',
        c: 100,
        d: Promise.reject(new Error('another error property')),
        e: (d) => {
          return Promise.reject(new Error('5'));
        },
        f: (a) => {
          return Promise.reject(new Error('6'));
        }
      }
    });
  });

  it('handles rejected promise case 2', (done) => {
    const store = getNewStore();
    store.subscribe(() => {
      const state = store.getState();
      console.log(state);
      expect(state.error).toBeTruthy();
      expect(state.payload.a).toBe(1);
      expect(state.payload.d).toBe(2);
      expect(state.payload.b).toBe('string');
      expect(state.payload.c).toBe(100);
      expect(state.payload.e.message).toEqual('5');
      expect(state.payload.f).toBeA(Function);
      done();
    });
    store.dispatch({
      type: 'REJECTED_PROMISE_CASE',
      payload: {
        a: Promise.resolve(1),
        b: 'string',
        c: 100,
        d: Promise.resolve(2),
        e: (d) => {
          return Promise.reject(new Error('5'));
        },
        f: (e) => {
          return Promise.reject(new Error('6'));
        }
      }
    });
  });
});

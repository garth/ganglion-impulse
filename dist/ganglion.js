'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var arrayOrSingle = function arrayOrSingle(data) {
  return Array.isArray(data) && data.length === 1 ? data[0] : data;
};

var callNextAction = function callNextAction(actions, context, data, options) {
  // if there are no more actions return the final action response to the impulse caller
  if (!actions.length) {
    return options.resolve(arrayOrSingle(data));
  }

  // assume all actions are concurrent sets
  var actionSet = Array.isArray(actions[0]) ? actions[0] : [actions[0]];

  // if async actions take longer than callSlowAsyncActionAfter ms, call the onSlowAsyncActionStart hook
  var calledSlowAsyncAction = false;
  var slowActionTimer = setTimeout(function () {
    if (typeof options.onSlowAsyncActionStart === 'function') {
      calledSlowAsyncAction = true;
      options.onSlowAsyncActionStart.call(context, true);
    }
  }, options.callSlowAsyncActionAfter);

  // call all actions in the set
  Promise
  // wait for all responses to resolve before calling the next action
  .all(actionSet.map(function (action) {
    return action.call(context, arrayOrSingle(data));
  }))
  // all actions resolved
  .then(function (responses) {
    // if we called the onSlowAsyncActionStart hook call the onSlowAsyncActionEnd hook
    clearTimeout(slowActionTimer);
    if (calledSlowAsyncAction && typeof options.onSlowAsyncActionEnd === 'function') {
      options.onSlowAsyncActionEnd.call(context, false);
    }
    // call the next action
    callNextAction(actions.splice(1), context, responses, options);
  })
  // if one of the promises failed send propigate the failure
  ['catch'](options.reject);
};

var Ganglion = function Ganglion() {
  var options = arguments[0] === undefined ? {} : arguments[0];

  this.impulse = {};
  this.options = Object.assign({ context: {}, callSlowAsyncActionAfter: 500 }, options);
  var self = this;

  this.fiber = function (name) {
    for (var _len = arguments.length, actions = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      actions[_key - 1] = arguments[_key];
    }

    if (self.impulse[name]) {
      throw '' + name + ' fiber has already been defined';
    }
    self.impulse[name] = function () {
      for (var _len2 = arguments.length, data = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        data[_key2] = arguments[_key2];
      }

      // make some metadata available on the context
      var impulseContext = Object.assign({}, self.options.context, { fiberName: name });
      // call the onBeforeImpulse handler
      if (typeof self.options.onBeforeImpulse === 'function') {
        self.options.onBeforeImpulse.call(impulseContext, data);
      }
      return new Promise(function (resolve, reject) {
        // start the impulse
        callNextAction(actions, impulseContext, data, Object.assign({ resolve: resolve, reject: reject }, options));
      }).then(function (responseData) {
        // call the onAfterImpulse handler
        if (typeof self.options.onAfterImpulse === 'function') {
          self.options.onAfterImpulse.call(impulseContext, responseData);
        }
        return responseData;
      });
    };
  };
};

exports['default'] = Ganglion;
module.exports = exports['default'];

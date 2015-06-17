let arrayOrSingle = function (data) {
  return Array.isArray(data) && data.length === 1 ? data[0] : data;
};

let callNextAction = function (actions, context, data, options) {
  // if there are no more actions return the final action response to the impulse caller
  if (!actions.length) {
    return options.resolve(arrayOrSingle(data));
  }

  // assume all actions are concurrent sets
  let actionSet = Array.isArray(actions[0]) ? actions[0] : [actions[0]];

  // if async actions take longer than callSlowAsyncActionAfter ms, call the onSlowAsyncActionStart hook
  let calledSlowAsyncAction = false;
  let slowActionTimer = setTimeout(function () {
    if (typeof options.onSlowAsyncActionStart === 'function') {
      calledSlowAsyncAction = true;
      options.onSlowAsyncActionStart.call(context, true);
    }
  }, options.callSlowAsyncActionAfter);

  // call all actions in the set
  Promise
    // wait for all responses to resolve before calling the next action
    .all(actionSet.map(action => action.call(context, arrayOrSingle(data))))
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
    .catch(options.reject);
};

let Ganglion = function (options = {}) {
  this.impulse = {};
  this.options = Object.assign({ context: {}, callSlowAsyncActionAfter: 500 }, options);
  let self = this;

  this.fiber = function (name, ...actions) {
    if (self.impulse[name]) {
      throw `${name} fiber has already been defined`;
    }
    self.impulse[name] = function (...data) {
      // make some metadata available on the context
      let impulseContext = Object.assign({}, self.options.context, { fiberName: name });
      // call the onBeforeImpulse handler
      if (typeof self.options.onBeforeImpulse === 'function') {
        self.options.onBeforeImpulse.call(impulseContext, data);
      }
      return new Promise(function (resolve, reject) {
        // start the impulse
        callNextAction(actions, impulseContext, data, Object.assign({ resolve, reject }, options));
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

export default Ganglion;

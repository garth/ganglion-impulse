let arrayOrSingle = function (data) {
  return Array.isArray(data) && data.length === 1 ? data[0] : data;
};

let callNextAction = function (actions, context, data, options) {
  // if the previous action or hook has set cancelImpulse=true on the context then stop
  if (context.cancelImpulse) {
    return options.reject({
      message: `${context.fibreName} impulse has been cancelled`,
      data: arrayOrSingle(data)
    });
  }
  // if there are no more actions return the final action response to the impulse caller
  if (!actions.length) {
    return options.resolve(arrayOrSingle(data));
  }

  // assume all actions are concurrent sets
  let actionSet = Array.isArray(actions[0]) ? actions[0] : [actions[0]];

  // if async actions take longer than callSlowAsyncActionAfter ms, call the onSlowAsyncActionStart hook
  let calledSlowAsyncAction = false;
  let slowActionTimer = setTimeout(function () {
    calledSlowAsyncAction = true;
    options.trigger('slowAsyncActionStart', context, true);
  }, options.callSlowAsyncActionAfter);

  // call all actions in the set
  Promise
    // wait for all responses to resolve before calling the next action
    .all(actionSet.map(action => action.call(context, arrayOrSingle(data))))
    // all actions resolved
    .then(function (responses) {
      // if we called the onSlowAsyncActionStart hook call the onSlowAsyncActionEnd hook
      clearTimeout(slowActionTimer);
      if (calledSlowAsyncAction) {
        options.trigger('slowAsyncActionEnd', context, false);
      }
      // call the next action
      callNextAction(actions.splice(1), context, responses, options);
    })
    // if one of the promises failed send propigate the failure
    .catch(options.reject);
};

let Ganglion = function (options = {}) {
  let self = this;
  this.impulse = {};
  this.options = Object.assign({ context: {}, callSlowAsyncActionAfter: 500 }, options);
  let events = {};

  this.on = function (event, handler) {
    events[event] = events[event] || [];
    events[event].push(handler);
  };

  this.off = function (event, handler) {
    if (event in events === false) {
      return;
    }
    events[event].splice(events[event].indexOf(handler), 1);
  };

  let trigger = function(event, context, ...args) {
    if (event in events === false) {
      return;
    }
    events[event].forEach(function (handler) {
      handler.apply(context, args);
    });
  };

  this.fibre = this.fiber = function (name, ...actions) {
    if (self.impulse[name]) {
      throw `${name} fibre has already been defined`;
    }
    self.impulse[name] = function (...data) {
      // make some metadata available on the context
      let impulseContext = Object.assign({}, self.options.context, { fiberName: name, fibreName: name });
      // emit the beforeImpulse event
      trigger('beforeImpulse', impulseContext, data);
      return new Promise(function (resolve, reject) {
        // start the impulse
        callNextAction(actions, impulseContext, data, Object.assign({ resolve, reject, trigger }, options));
      }).then(function (responseData) {
        // emit the afterImpulse event
        trigger('afterImpulse', impulseContext, responseData);
        return responseData;
      }).catch(function (responseData) {
        // emit the afterImpulse event
        trigger('error', impulseContext, responseData);
        return responseData;
      });
    };
  };

  this.addToContext = function (context) {
    if (typeof context !== 'object') {
      throw 'context data must be an object';
    }
    this.options.context = Object.assign(this.options.context, context);
  };
};

export default Ganglion;

let arrayOrSingle = function (data) {
  return Array.isArray(data) && data.length === 1 ? data[0] : data;
};

let callNextAction = function (actions, context, data, promise) {
  // if there are no more actions return the final action response to the impulse caller
  if (!actions.length) {
    return promise.resolve(arrayOrSingle(data));
  }

  // assume all actions are concurrent sets
  let actionSet = Array.isArray(actions[0]) ? actions[0] : [actions[0]];

  // call all actions in the set
  Promise
    // wait for all responses to resolve before calling the next action
    .all(actionSet.map(action => action.call(context, arrayOrSingle(data))))
    // all actions resolved, so call next
    .then(function (responses) {
      callNextAction(actions.splice(1), context, responses, promise);
    })
    // if one of the promises failed send propigate the failure
    .catch(promise.reject);
};

let Ganglion = function (context = {}) {
  this.impulse = {};
  this.context = context;
  let self = this;

  this.fiber = function (name, ...actions) {
    if (self.impulse[name]) {
      throw `${name} fiber has already been defined`;
    }
    self.impulse[name] = function (...data) {
      return new Promise(function (resolve, reject) {
        // make some metadata available on the context
        let impulseContext = Object.assign({}, self.context, { fiberName: name });
        // start the impulse
        callNextAction(actions, impulseContext, data, { resolve, reject });
      });
    };
  };
};

export default Ganglion;

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var callNextAction = function callNextAction(actions, context, data, promise) {
  // if there are no more actions return the final action response to the impulse caller
  if (!actions.length) {
    return promise.resolve(Array.isArray(data) && data.length === 1 ? data[0] : data);
  }

  // assume all actions are concurrent sets
  var actionSet = Array.isArray(actions[0]) ? actions[0] : [actions[0]];

  // call all actions in the set
  Promise
  // wait for all responses to resolve before calling the next action
  .all(actionSet.map(function (action) {
    return action.call(context, Array.isArray(data) && data.length === 1 ? data[0] : data);
  }))
  // all actions resolved, so call next
  .then(function (responses) {
    callNextAction(actions.splice(1), context, responses, promise);
  })
  // if one of the promises failed send propigate the failure
  ["catch"](promise.reject);
};

var Ganglion = function Ganglion() {
  var context = arguments[0] === undefined ? {} : arguments[0];

  this.impulse = {};
  this.context = context;
  var self = this;

  this.fiber = function (name) {
    for (var _len = arguments.length, actions = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      actions[_key - 1] = arguments[_key];
    }

    if (self.impulse[name]) {
      throw "" + name + " impulse has already been defined";
    }
    self.impulse[name] = function () {
      for (var _len2 = arguments.length, data = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        data[_key2] = arguments[_key2];
      }

      return new Promise(function (resolve, reject) {
        // make some metadata available on the context
        var impulseContext = Object.assign({}, self.context, { impulseName: name });
        // start the impulse
        callNextAction(actions, impulseContext, data, { resolve: resolve, reject: reject });
      });
    };
  };
};

exports["default"] = Ganglion;
module.exports = exports["default"];

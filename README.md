Ganglion Impulse
================

> In anatomy, a [ganglion](https://en.wikipedia.org/wiki/Ganglion) (/ˈɡæŋɡliən/
> gang-glee-ən; plural ganglia) is a nerve cell cluster.

A JavaScript library for registering fibers that transmit impulses from a central ganglion,
triggering a chain of actions.

Ganglion is heavily inspired by [Cerebral](https://github.com/christianalfoni/cerebral)
but does not include a data store or any [React](http://facebook.github.io/react/) component
integration as Cerebral does.

Ganglion is small (< 1k minimised and gzipped) and it does not have any dependencies.

Why Use Ganglion
----------------

Ganglion can be used as the central nervous system of an application. It facilitates a clean
and understandable definition of one way data flows through an application. It can utilise
reusable action functions and manage asynchronous actions in series or parallel. If your
async server operation is taking longer than expected it can let your app know it needs to
give feedback to the user via a spinner or asking the user if they wish to cancel.

Ganglion is best when paired with an
[immutable data store](https://github.com/rtfeldman/seamless-immutable), which it can pass to
all actions via context provided to its constructor. For user interface rendering
[React](http://facebook.github.io/react/) works well, but other libraries could also be used.

Hooks on the ganglion allow operations to be executed before or after every impulse. These can
be used to setup automatic re-rendering after mutative impulses have completed.

Installation
------------

```
npm install ganglion-impulse
```

Include ganglion in your app with:

```JavaScript
var Ganglion = require('ganglion-impulse');
```

For a client-side project you can use [Browserify](http://browserify.org/) or
[webpack](http://webpack.github.io/).

Usage
-----

### Example

```JavaScript
// es6 example, but will also work with es5.

import Ganglion from 'ganglion-impulse';
import { sendCredentialsToServer, setUserInfo } from './custom-application-actions';

// create a new ganglion
let ganglion = new Ganglion();

// define some fibers
ganglion.fiber('loginClicked', sendCredentialsToServer, setUserInfo);

// send impulses
ganglion.impulse.loginClicked({ userName, password }).then(function () {
  console.log('impulse completed');
});
```
If actions return a Promise then ganglion will wait for them to resolve before calling the
next action in the chain.

### Parallel actions

Actions can run in parallel if passed as an array:

```JavaScript
ganglion.fiber('buttonClicked',
  prepareAction, [parallelAction1,
                  parallelAction2], finalAction);
```

### Sending Data

The first action receives the parameter passed when the impulse is initiated, subsequent
actions receive the response from the previous action. The response from the final action is
returned via a promise to the caller. When parallel actions are used, the response of both
will be passed as an array to the next in the same order as the actions are defined on the
fiber.

### Context Data

Context information can be passed to the ganglion constructor which will then be made available
to all actions called when an impulse is initiated:

```JavaScript
// create a new ganglion with some context data
let ganglion = new Ganglion({
  context: { dataStore: {} }
});

ganglion.fiber('userChangedName', function updateUserName(userName) {
  this.dataStore.userName = userName;
});
```

The name of the current fiber is also available via the impulse's context:

```JavaScript
ganglion.fiber('eventReceived', function logTheFiberName() {
  console.log(this.fiberName);
});
```

Context is initialised per impulse. Any mutations will be available to subsequent actions but
will be discarded after the final action. The properties defined with original context passed
to the ganglion constructor are retained across all impulses.

### Hooks

#### onBeforeImpulse / onAfterImpulse

The optional onBeforeImpulse or onAfterImpulse hooks passed to the ganglion constructor will
be called before and after every impulse emitted. Hooks have the same signature as actions, but
the return value is discarded.

```JavaScript
// create a new ganglion with onBeforeImpulse and onAfterImpulse hooks
let ganglion = new Ganglion({
  onBeforeImpulse(data) {
    // data will be also be passed to the first action
    console.log(`${this.fiberName} impulse started`);
  },
  onAfterImpulse(data) {
    // data is the value that was returned by the last action
    console.log(`${this.fiberName} impulse ended`);
  }
});
```

### Canceling an Impulse

Any action or hook can cancel an impulse by setting `cancelImpulse = true` on the context:

```JavaScript
ganglion.fiber('buttonClicked',
  firstAction,
  function secondAction(data) { this.cancelImpulse = true; },
  finalActionWontBeCalled);
```

#### onSlowAsyncActionStart / onSlowAsyncActionEnd

The optional onSlowAsyncActionStart and onSlowAsyncActionEnd will be called when async actions
take a while to complete.

```JavaScript
let slowActionHook = function (isStart) {
  let status = isStart ? 'is running slow' : 'completed';
  console.log(`${this.fiberName} async action ${status}`);
};

// create a new ganglion with onSlowAsyncActionStart and onSlowAsyncActionEnd hooks
let ganglion = new Ganglion({
  callSlowAsyncActionAfter: 500, // ms after which the
                                 // onSlowAsyncActionStart will be called
  onSlowAsyncActionStart: slowActionHook,
  onSlowAsyncActionEnd: slowActionHook
});
```

To ensure that the slow async action hooks are not called unnecessarily, `callSlowAsyncActionAfter`
can be used to define after how many milliseconds should be hooks be called. By default this is
set to 500ms.

Contributing
------------

Checkout the git repository and install the build and test dependencies

```
npm install
```

### Testing

The automated tests can be run via

```
npm test
```

### Building

Ganglion uses es6 and should be transpiled prior to publishing

```
npm run build
```

Changelog
---------

### master

* Added `debug = true` option to log out impulses to the console

### 0.3.1

* Improved the documentation
* Added the ability for any action or hook to cancel an impulse

### 0.3.0

* Added onSlowAsyncActionStart and onSlowAsyncActionEnd hooks

### 0.2.0

* Added onBeforeImpulse and onAfterImpulse hooks

### 0.1.1

* Fixed dist build

### 0.1.0

* Initial release

License
-------

The MIT License (MIT)

Copyright (c) 2015 Garth Williams

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

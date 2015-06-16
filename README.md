Ganglion Impulse
================

> In anatomy, a [ganglion](https://en.wikipedia.org/wiki/Ganglion) (/ˈɡæŋɡliən/
> gang-glee-ən; plural ganglia) is a nerve cell cluster.

A JavaScript library for registering fibers that transmit impulses from from a central
ganglion triggering a chain of actions.

Ganglion is heavily inspired by [Cerebral](https://github.com/christianalfoni/cerebral)
but does not include a data store or any [React](http://facebook.github.io/react/) component
integration as Cerebral does.

Ganglion is small (~2k before minification) and it does not have any dependencies.

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

```JavaScript
// es6 example, but will also work with es5.

import Ganglion from 'ganglion-impulse';
import { sendCredentialsToServer, setUserInfo } from './custom-application-actions';

// create a new ganglion
let nerveCentre = new Ganglion();

// define some fibers
nerveCentre.fiber('loginClicked', sendCredentialsToServer, setUserInfo);

// send impulses
nerveCentre.impulse.loginClicked({ userName, password }).then(function () {
  console.log('impulse completed');
});
```

If actions return a Promise then ganglion will wait for them to resolve before calling the
next action in the chain. Actions can run in parallel if passed as an array:

```JavaScript
nerveCentre.fiber('buttonClicked', prepareAction, [parallelAction1, parallelAction2], finalAction);
```

The first action receives the parameter passed when the impulse is initated, subsequent
actions receive the response from the previous action. The response from the final action is
returned via a promise to the caller. When parallel actions are used, the response of both
will be passed as an array to the next in the same order as the actions are defined.

Context information can be passed to the ganglion constructor which will then be made available
to all actions called when an impulse is sent:

```JavaScript
// create a new ganglion with some context data
let nerveCentre = new Ganglion({ dataStore: {} });

nerveCentre.fiber('userChangedName', function updateUserName(userName) {
  this.dataStore.userName = userName;
});
```

The name of the current fiber is also available via the impulse's context:

```JavaScript
nerveCentre.fiber('eventReceived', function doStuff() {
  if (this.fiberName === 'eventReceived') {
    // do something
  }
});
```

Context is initialised per impulse. Any mutations will be available to subsequent actions but
will be discarded after the final action. The properties defined with original context passed
to the ganglion constructor are retained across all impulses.

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

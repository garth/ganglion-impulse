'use strict';

import Ganglion from '../lib/ganglion';
import { expect } from 'chai';

describe('hooks', function () {

  it('onBeforeImpulse hook is called for all fibers', function () {
    let ganglion = new Ganglion({
      onBeforeImpulse(data) {
        this.beforeCalled = true;
      }
    });
    ganglion.fiber('clicked', function () { return this.beforeCalled; });
    return ganglion.impulse.clicked().then(function (data) {
      expect(data).to.be.true;
    });
  });


  it('onAfterImpulse hook is called for all fibers', function () {
    let ganglion = new Ganglion({
      onAfterImpulse(data) {
        data.afterCalled = true;
      }
    });
    ganglion.fiber('clicked', function () { return {}; });
    return ganglion.impulse.clicked().then(function (data) {
      expect(data.afterCalled).to.be.true;
    });
  });

});

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

  it('onSlowAsyncActionStart/onSlowAsyncActionEnd are not called for quick async actions', function () {
    let calledStart = false;
    let calledEnd = false;
    let ganglion = new Ganglion({
      callSlowAsyncActionAfter: 20,
      onSlowAsyncActionStart(isStarting) {
        calledStart = true;
      },
      onSlowAsyncActionEnd(isStarting) {
        calledEnd = true;
      }
    });
    ganglion.fiber('clicked', function () {
      return new Promise(function (resolve) { setTimeout(resolve, 10); });
    });
    return ganglion.impulse.clicked().then(function (data) {
      expect(calledStart).to.be.false;
      expect(calledEnd).to.be.false;
    });
  });

  it('onSlowAsyncActionStart/onSlowAsyncActionEnd are called for slow actions', function () {
    let calledStart = false;
    let calledEnd = false;
    let ganglion = new Ganglion({
      callSlowAsyncActionAfter: 10,
      onSlowAsyncActionStart(isStarting) {
        expect(isStarting).to.be.true;
        calledStart = true;
      },
      onSlowAsyncActionEnd(isStarting) {
        expect(isStarting).to.be.false;
        calledEnd = true;
      }
    });
    ganglion.fiber('clicked', function () {
      return new Promise(function (resolve) { setTimeout(resolve, 12); });
    });
    return ganglion.impulse.clicked().then(function (data) {
      expect(calledStart).to.be.true;
      expect(calledEnd).to.be.true;
    });
  });

});

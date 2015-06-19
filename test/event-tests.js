'use strict';

import Ganglion from '../lib/ganglion';
import { expect } from 'chai';

describe('hooks', function () {

  it('beforeImpulse event is triggered for all fibers', function () {
    let ganglion = new Ganglion();
    ganglion.on('beforeImpulse', function (data) {
      this.beforeCalled = true;
    });
    ganglion.fiber('clicked', function () { return this.beforeCalled; });
    return ganglion.impulse.clicked().then(function (data) {
      expect(data).to.be.true;
    });
  });

  it('afterImpulse event is triggered for all fibers', function () {
    let ganglion = new Ganglion();
    ganglion.on('afterImpulse', function (data) {
      data.afterCalled = true;
    });
    ganglion.fiber('clicked', function () { return {}; });
    return ganglion.impulse.clicked().then(function (data) {
      expect(data.afterCalled).to.be.true;
    });
  });

  it('slowAsyncActionStart/slowAsyncActionEnd are not triggered for quick async actions', function () {
    let calledStart = false;
    let calledEnd = false;
    let ganglion = new Ganglion({
      callSlowAsyncActionAfter: 20
    });
    ganglion.on('slowAsyncActionStart', function (isStarting) {
      calledStart = true;
    });
    ganglion.on('slowAsyncActionEnd', function (isStarting) {
      calledEnd = true;
    });
    ganglion.fiber('clicked', function () {
      return new Promise(function (resolve) { setTimeout(resolve, 10); });
    });
    return ganglion.impulse.clicked().then(function (data) {
      expect(calledStart).to.be.false;
      expect(calledEnd).to.be.false;
    });
  });

  it('slowAsyncActionStart/slowAsyncActionEnd are triggered for slow actions', function () {
    let calledStart = false;
    let calledEnd = false;
    let ganglion = new Ganglion({
      callSlowAsyncActionAfter: 10
    });
    ganglion.on('slowAsyncActionStart', function (isStarting) {
      expect(isStarting).to.be.true;
      calledStart = true;
    });
    ganglion.on('slowAsyncActionEnd', function (isStarting) {
      expect(isStarting).to.be.false;
      calledEnd = true;
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

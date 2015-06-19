'use strict';

import Ganglion from '../lib/ganglion';
import { expect } from 'chai';

describe('event', function () {

  it('has access to the fiber name', function () {
    var eventCalled = false;
    var ganglion = new Ganglion();
    ganglion.on('beforeImpulse', function () {
      eventCalled = true;
      expect(this.fiberName).to.equal('clicked');
    });
    ganglion.fiber('clicked');
    return ganglion.impulse.clicked().then(function () {
      expect(eventCalled).to.be.true;
    });
  });

  it('has access to injected context data', function () {
    var eventCalled = false;
    var ganglion = new Ganglion({ context: { test: 'value' } });
    ganglion.on('beforeImpulse', function () {
      eventCalled = true;
      expect(this.test).to.equal('value');
    });
    ganglion.fiber('clicked');
    return ganglion.impulse.clicked().then(function () {
      expect(eventCalled).to.be.true;
    });
  });

  it('error event is triggered on rejected promise', function () {
    let errorCalled = false;
    let ganglion = new Ganglion();
    ganglion.on('error', function (error) {
      errorCalled = true;
      expect(error).to.equal('error');
    });
    ganglion.fiber('clicked', function () {
      return new Promise(function (resolve, reject) {
        reject('error');
      });
    });
    return ganglion.impulse.clicked().catch(function (error) {
      expect(error).to.equal('error');
      expect(errorCalled).to.be.true;
    });
  });

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

'use strict';

import Ganglion from '../lib/ganglion';
import { expect } from 'chai';

describe('fiber', function () {

  it('returns a promise that has the data returned from the last action', function () {
    let ganglion = new Ganglion();
    ganglion.fiber('clicked1');
    ganglion.fiber('clicked2', function () { return 'abc'; });
    ganglion.fiber('clicked3', function () {
      return new Promise(function (resolve) { resolve('xyz'); });
    });
    return Promise.all([
      ganglion.impulse.clicked1('123'),
      ganglion.impulse.clicked2('123'),
      ganglion.impulse.clicked3('123')
    ]).then(function (data) {
      expect(data).to.eql(['123', 'abc', 'xyz']);
    });
  });

  it('chains actions', function () {
    let ganglion = new Ganglion();
    let called = [];
    ganglion.fiber('clicked',
      function () { called.push(1); },
      function () { called.push(2); },
      function () { called.push(3); }
    );
    return ganglion.impulse.clicked().then(function () {
      expect(called).to.eql([1, 2, 3]);
    });
  });

  it('sends the response from the previous action to the next', function () {
    var ganglion = new Ganglion({ key: 'value' });
    ganglion.fiber('clicked', function () {
      return 'response 1';
    }, function (data) {
      expect(data).to.equal('response 1');
      return new Promise(function (resolve) { resolve('response 2'); });
    }, function (data) {
      expect(data).to.equal('response 2');
      return data;
    });
    return ganglion.impulse.clicked().then(function (data) {
      expect(data).to.equal('response 2');
    });
  });

  it('can call async actions concurrently', function () {
    let ganglion = new Ganglion();
    var execTime = 20; // smaller numbers can cause false positive falures
    let asyncAction = function () {
      return new Promise(function (resolve) { setTimeout(resolve, execTime); });
    };
    ganglion.fiber('clickedSync', asyncAction, asyncAction);
    ganglion.fiber('clickedAsync', [asyncAction, asyncAction]);
    ganglion.fiber('clickedSyncAndAsync', [asyncAction, asyncAction], asyncAction);

    let testTimeBetween = function (type, min, max) {
      let startDate = new Date();
      return function () {
        let ms = new Date() - startDate;
        //console.log(`excpected ${ms}ms (${type}) to be between ${min}ms and ${max - 1}ms`);
        expect(ms, type).to.be.within(min, max - 1);
      };
    };

    return Promise.all([
      ganglion.impulse.clickedSync()
        .then(testTimeBetween('sync', execTime * 2, execTime * 2.5)),
      ganglion.impulse.clickedAsync()
        .then(testTimeBetween('async', execTime, execTime * 2)),
      ganglion.impulse.clickedSyncAndAsync()
        .then(testTimeBetween('sync and async', execTime * 2, execTime * 2.5))
    ]);
  });

});

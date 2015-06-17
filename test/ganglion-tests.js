'use strict';

import Ganglion from '../lib/ganglion';
import { expect } from 'chai';

describe('ganglion', function () {

  it('has no fibers by default', function () {
    let ganglion = new Ganglion();
    expect(ganglion.impulse).to.be.empty;
  });

  it('can add fibers', function () {
    var ganglion = new Ganglion();
    ganglion.fiber('clicked');
    expect(ganglion.impulse).to.not.be.empty;
    expect(ganglion.impulse.clicked).to.be.a('function');
  });

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

    it('can define an onBeforeImpulse handler for all fibers', function () {
      let ganglion = new Ganglion({
        onBeforeImpulse: function (data) {
          this.beforeCalled = true;
        }
      });
      ganglion.fiber('clicked', function () { return this.beforeCalled; });
      return ganglion.impulse.clicked().then(function (data) {
        expect(data).to.be.true;
      });
    });


    it('can define an onAfterImpulse handler for all fibers', function () {
      let ganglion = new Ganglion({
        onAfterImpulse: function (data) {
          data.afterCalled = true;
        }
      });
      ganglion.fiber('clicked', function () { return {}; });
      return ganglion.impulse.clicked().then(function (data) {
        expect(data.afterCalled).to.be.true;
      });
    });

  });

  describe('action', function () {

    it('has access to the fiber name', function () {
      var ganglion = new Ganglion();
      ganglion.fiber('clicked', function () { return `name is ${this.fiberName}`; });
      return ganglion.impulse.clicked().then(function (name) {
        expect(name).to.equal('name is clicked');
      });
    });

    it('has access to injected context data', function () {
      var ganglion = new Ganglion({ context: { key: 'value' } });
      ganglion.fiber('clicked', function () { return `context key is ${this.key}`; });
      return ganglion.impulse.clicked().then(function (name) {
        expect(name).to.equal('context key is value');
      });
    });

    it('can not mutate context data for other impulses', function () {
      var ganglion = new Ganglion({ context: { key: 'value' } });
      ganglion.fiber('clicked', function () {
        expect(this.key).to.equal('value');
        this.key = 'other';
      });
      return Promise.all([
        ganglion.impulse.clicked(),
        ganglion.impulse.clicked()
      ]);
    });

    it('can mutate context data for actions on the same impulse', function () {
      var ganglion = new Ganglion({ context: { key: 'value' } });
      ganglion.fiber('clicked', function () {
        expect(this.key).to.equal('value');
        this.key = 'other';
      }, function () {
        expect(this.key).to.equal('other');
      });
      return ganglion.impulse.clicked();
    });

    it('can receive and return arrays', function () {
      var ganglion = new Ganglion({ context: { key: 'value' } });
      ganglion.fiber('clicked', function (input) {
        expect(input).to.eql(['in']);
        return ['middle'];
      }, function (input) {
        expect(input).to.eql(['middle']);
        return ['out'];
      });
      return ganglion.impulse.clicked(['in']).then(function (output) {
        expect(output).to.eql(['out']);
      });
    });
  });

});

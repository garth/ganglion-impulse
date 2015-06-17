'use strict';

import Ganglion from '../lib/ganglion';
import { expect } from 'chai';

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

  it('can cancel an impulse', function () {
    let ganglion = new Ganglion();
    let called = [];
    ganglion.fiber('clicked',
      function () { called.push(1); },
      function () {
        called.push(2);
        this.cancelImpulse = true;
      },
      function () { called.push(3); }
    );
    return ganglion.impulse.clicked().catch(function (error) {
      expect(error.message).to.equal('clicked impulse has been cancelled');
      expect(called).to.eql([1, 2]);
    });
  });

});

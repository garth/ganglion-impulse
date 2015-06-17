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

});

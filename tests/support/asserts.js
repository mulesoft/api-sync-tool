'use strict';

module.exports = {
  notCalled: notCalled,
  calledOnceWithExactly: calledOnceWithExactly,
  calledOnceWithoutParameters: calledOnceWithoutParameters,
  onlyThisMethodsCalled: onlyThisMethodsCalled
};

function notCalled(methods) {
  methods.forEach(function (method) {
    method.called.should.not.be.true();
  });
}

function calledOnceWithoutParameters(stubFunctions) {
  stubFunctions.forEach(function (stubFunction) {
    stubFunction.calledOnce.should.be.true();
    stubFunction.firstCall.args.length.should.equal(0);
  });
}

function calledOnceWithExactly(stubFunction, args) {
  stubFunction.calledOnce.should.be.true();
  stubFunction.firstCall.calledWithExactly.apply(stubFunction.firstCall, args)
    .should.be.true();
}

function onlyThisMethodsCalled(object, methods) {
  Object.keys(object)
    .filter(function (key) {
      return methods.indexOf(key) === -1;
    })
    .forEach(function (key) {
      notCalled([object[key]]);
    });

  methods.forEach(function (key) {
    object[key].called.should.be.true();
  });
}

'use strict';

module.exports = {
  notCalled: notCalled,
  calledOnceWithoutParameters: calledOnceWithoutParameters
};

function notCalled(methods) {
  methods.forEach(function (method) {
    method.called.should.not.be.true;
  });
}

function calledOnceWithoutParameters(stubFunctions) {
  stubFunctions.forEach(function (stubFunction) {
    stubFunction.calledOnce.should.be.true;
    stubFunction.firstCall.args.length.should.equal(0);
  });
}

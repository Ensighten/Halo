/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
/*
  ======== A Handy Little QUnit Reference ========
  http://docs.jquery.com/QUnit

  Test methods:
    expect(numAssertions)
    stop(increment)
    start(decrement)
  Test assertions:
    ok(value, [message])
    equal(actual, expected, [message])
    notEqual(actual, expected, [message])
    deepEqual(actual, expected, [message])
    notDeepEqual(actual, expected, [message])
    strictEqual(actual, expected, [message])
    notStrictEqual(actual, expected, [message])
    raises(block, [expected], [message])
*/

module('A SocketModel');

test('can be created', function() {
  expect(1);

  // Load SocketModel
  stop();
  require(['mvc!m/SocketModel'], function (SocketModel) {
    start();

    // Create the model
    var model = new SocketModel({
          'name': 'socketModel#create',
          'retrieve': function () {}
        });
    ok(model);
  });
});

test('has this.socket', function() {
  expect(1);

  // Load SocketModel
  stop();
  require(['Sauron', 'mvc!m/SocketModel'], function (Sauron, SocketModel) {
    start();

    // Create the model
    var name = 'socketModel#socket',
        model = new SocketModel({
          'name': name,
          'retrieve': function (cb) {
            var that = this;
            cb(that);
          }
        });

    // Grab `this` from the model
    stop();
    Sauron.model(name).retrieve(function (that) {
      start();

      // Assert that.socket exists
      ok(that.socket);
    });
  });
});
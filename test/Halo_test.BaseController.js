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

module('A BaseController');

test('can be created', function() {
  expect(1);

  // Load BaseController
  stop();
  require(['mvc!c/BaseController'], function (BaseController) {
    start();

    // Create the model
    var controller = new BaseController({
          'name': 'baseController#create',
          'start': function () {},
          'stop': function () {}
        });
    ok(controller);
  });
});

test('can when started, calls `start`', function() {
  expect(3);

  // Load BaseController
  stop();
  require(['Sauron', 'mvc!c/BaseController'], function (Sauron, BaseController) {
    start();

    // Create the model
    var placeholder,
        name = 'baseController#start',
        model = new BaseController({
          'name': name,
          'start': function (data, cb) {
            placeholder = data;
            if (cb) { cb(null); }
          }
        });

    // Get and set some data
    stop();
    Sauron.controller(name).start({'id': 'hello', 'val': 'world'}, function () {
      start();

      // Assert the placeholder
      ok(placeholder);
      strictEqual(placeholder.id, 'hello');
      strictEqual(placeholder.val, 'world');
    });
  });
});

test('can when stopped, calls `stop`', function() {
  expect(3);

  // Load BaseController
  stop();
  require(['Sauron', 'mvc!c/BaseController'], function (Sauron, BaseController) {
    start();

    // Create the model
    var placeholder,
        name = 'baseController#stop',
        model = new BaseController({
          'name': name,
          'stop': function (data, cb) {
            placeholder = data;
            if (cb) { cb(null); }
          }
        });

    // Get and set some data
    stop();
    Sauron.controller(name).stop({'id': 'hello', 'val': 'world'}, function () {
      start();

      // Assert the placeholder
      ok(placeholder);
      strictEqual(placeholder.id, 'hello');
      strictEqual(placeholder.val, 'world');
    });
  });
});
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

module('mvc');

test('can resolve views', function () {
  expect(1);

  // Load a view
  stop();
  require(['mvc!v/main'], function (view) {
    start();

    // Assert it is what we expected
    strictEqual(view, '<div>Hello World!</div>');
  });
});

// test('can resolve models', function () {
//   expect(1);

//   // Define our model at the expected path
//   define('models/user', function () {
//     return 'a';
//   });

//   // Load the model
//   stop();
//   require(['mvc!m/user'], function (model) {
//     start();

//     // Assert it is what we expected
//     strictEqual(model, 'a');
//   });
// });

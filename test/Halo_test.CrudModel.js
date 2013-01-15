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

module('A CrudModel');

test('can be created', function () {
  expect(1);

  // Load CrudModel
  stop();
  require(['mvc!m/CrudModel'], function (CrudModel) {
    start();

    // Create the model
    var model = new CrudModel({
          'name': 'crudModel#create',
          'create': function () {},
          'retrieve': function () {}
        });
    ok(model);
  });
});

test('can be created with a memory mixin', function () {
  expect(2);

  // Load CrudModel
  stop();
  require(['Sauron', 'mvc!m/CrudModel'], function (Sauron, CrudModel) {
    start();

    // Create the model
    var name = 'crudModel#mixin',
        model = new CrudModel({
          'name': name,
          'mixin': 'memory',
          'create': function (data, cb) {
            this.memory.set(data.id, data);
            if (cb) { cb(null); }
          },
          'retrieve': function (data, cb) {
            cb(null, this.memory.get(data.id));
          }
        });

    // Get and set some data
    Sauron.model(name).create({'id': 'hello', 'val': 'world'});
    stop();
    Sauron.model(name).retrieve({'id': 'hello'}, function (err, obj) {
      start();

      // Assert the returned data
      strictEqual(obj.id, 'hello');
      strictEqual(obj.val, 'world');
    });
  });
});
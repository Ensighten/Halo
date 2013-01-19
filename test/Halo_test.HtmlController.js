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

// "An HtmlController": {
//   "when started": {
//     "appends content to the container": true,
//     "when stopped": {
//       "removes content from the container": true
//     }
//   }
// }

module('An HtmlController');

test('when started, appends content to the container and when stopped, removes content from container', function () {
  expect(5);

  // Load HtmlController
  stop();
  require(['Sauron', 'jquery', 'HtmlController'], function (Sauron, $, HtmlController) {
    start();

    // Create the model
    var $container = $('#qunit-fixture'),
        placeholder,
        name = 'htmlController#startStop',
        model = new HtmlController({
          'name': name,
          'start': function (data, cb) {
            placeholder = data;

            // Render some content
            var $content = $('<div>Hello</div>');

            // Callback with it
            cb($content);
          }
        });

    // when started, appends content to the container
    stop();
    Sauron.controller(name).start($container, {'id': 'hello', 'val': 'world'}, function () {
      start();

      // Assert the placeholder
      ok(placeholder);
      strictEqual(placeholder.id, 'hello');
      strictEqual(placeholder.val, 'world');

      // Assert the content is in place
      var html = $container.html();
      strictEqual(html, '<div>Hello</div>');

      // when stopped, removes content from container
      Sauron.controller(name).stop(function () {
        // Assert the content has been removed
        var html = $container.html();
        notEqual(html, '<div>Hello</div>');
      });
    });
  });
});
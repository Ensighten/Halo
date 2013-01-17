# Views
As mentioned in the [README][readme], during the creation of the framework, we tried to stay as true to the thought

> A view is markup and interactive logic

as much as possible.

This document covers the tooling behind making the interactive part as automated as possible.

[readme]: https://github.com/Ensighten/Halo/blob/master/README.md

## Example
We will start with an HTML file, some jQuery bindings, and work backwards through our tooling.
```js
// main.html
<div id="main">
  <!-- Manual opt-in Bootstrap plugin -->
  <a href="#" class="tooltip" title="Awesome tooltip">Hover me</a>
  <!-- 3rd party plugin which doesn't natively bind to $(window).on('click', 'selector') -->
  <input id="starttime" class="bootstrap-timepicker"/>
</div>

// main.js
// Load in main.html, jquery, and our plugins
define(['jquery', 'mvc!v/main', 'HtmlController', 'bootstrap', 'timepicker'], function ($, html, HtmlController) {
  return HtmlController({
    'name': 'main',
    'start': function (data, cb) {
      // Render HTML into a jQuery collection
      var $html = $(html);

      // Find our targets and initialize their plugins
      $html.find('.tooltip').tooltip();
      $html.find('.bootstrap-timepicker').timepicker();

      // Callback with the $html
      cb($html);
    }
  });
});
```

----------------------

FAQ #1: Why not just `$('.tooltip').tooltip();`?

Halo is build to self-contain every controller as a module. The `$html` cannot be queried directly from the DOM until we know it is in there. However, this could be bound after we call back or main's container could be waiting a few seconds to append itself as well.

Additionally, if you query the DOM directly, you will wind up double/triple binding a lot of tooltips.

----------------------

Alright, now let's improve upon this a little with a template engine (I will use [jade][jade]) and a require.js plugin for slimmer dependencies (I will use [jqueryp][jqueryp]).

```js
// main.jade
#main
  a.tooltip(href="#", title="Awesome tooltip") Hover me
  input#starttime.bootstrap-timepicker

// main.js
// jqueryp loads in jquery and all requested plugins, then returns jquery
define(['jqueryp!bootstrap!timpicker', 'jade', 'mvc!v/main', 'HtmlController', function ($, jade, template, HtmlController) {
  return HtmlController({
    'name': 'main',
    'start': function (data, cb) {
      // Pass template through jade
      var html = jade.render(template);

      // Render HTML into a jQuery collection
      var $html = $(html);

      // Find our targets and initialize their plugins
      $html.find('.tooltip').tooltip();
      $html.find('.bootstrap-timepicker').timepicker();

      // Callback with the $html
      cb($html);
    }
  });
});
```

[jade]: https://github.com/visionmedia/jade
[jqueryp]: https://github.com/Ensighten/jqueryp

Alright, this is a little improvement readability-wise for the HTML but our controller is still suffering.

Additionally, it isn't very modular since there is a brittle link between controller and view. This means that if any other controller wanted to use the view, it would have to parse via `jade`, render HTML into a jQuery collection, query and bind `tooltip` and `timepicker`.

Time to overhaul this mechanism with [Builder][Builder]. Inside of Halo, we provide the `require` + `jQuery` flavor.

```js
// main.jade
// Same as before

// config.js
// Load in Builder, jade, and all jQuery plugins
define(['Builder', 'jade', 'jqueryp!bootstrap!timpicker'], function (Builder, jade, $) {
  // Set jade as the template engine
  Builder.set('template engine', jade.render);

  // Add in all jQuery plugins (Builder.jquery specific)
  Builder.addPlugin('tooltip');
  Builder.addPlugin({'module': 'timepicker', 'selector': '.bootstrap-timepicker'});

  // Return an empty config
  return {};
});

// main.js
define(['Builder', 'mvc!v/main', 'HtmlController', function (Builder, template, HtmlController) {
  return HtmlController({
    'name': 'main',
    'start': function (data, cb) {
      // Render and bind $html via Builder
      // template -> html (via jade) -> $html (via jQuery) -> bound $html (via Builder.addPlugin)
      var $html = Builder(template);

      // Callback with the $html
      cb($html);
    }
  });
});
```

[Builder]: https://github.com/Ensighten/Builder

From this, we have cleaned up `main.js` and made the view reusable. Additional bonuses include:

- Builder handles gotchas like using both `$html.filter` and `$html.find` which would usually miss out on top-level elements in the collection.
- Any template passed through Builder will automatically initialize `tooltip` and `timepicker` (not exclusive to `main.jade`).


----------------------

FAQ #2: Can I use
```js
$(window).on('click', '.bootstrap-timepicker', function () {
  $(this).timepicker();
});
```
over `Builder.addModule('timepicker');`?

Yes, but you will wind up initializing timepicker each and every time that timepicker is clicked.

Fortunately, some plugins ([timepicker included][timepickerInit]) have a safety mechanism for this but you should probably stay on the safe side of the fence.

----------------------

[timepicker]: http://jdewit.github.com/bootstrap-timepicker/
[timepickerInit]: https://github.com/jdewit/bootstrap-timepicker/blob/796688ba405916186aeae4326165b219f4c6659d/js/bootstrap-timepicker.js#L780-L782
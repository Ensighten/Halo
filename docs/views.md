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
  <input id="starttime" class="timepicker"/>
</div>

// main.js
// Load in main.html, jquery, and our plugins
define(['jquery', 'mvc!v/main', 'HtmlController', 'bootstrap', 'bootstrap-timepicker'], function ($, html, HtmlController) {
  return HtmlController({
    'name': 'main',
    'start': function (data, cb) {
      // Render HTML into a jQuery collection
      var $html = $(html);

      // Find our targets and initialize their plugins
      $html.find('.tooltip').tooltip();
      $html.find('.timepicker').timepicker();

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



...


----------------------

FAQ #n: Can I use
```js
$(window).on('click', '.timepicker', function () {
  $(this).timepicker();
});
```
over `Builder.addModule('timepicker');`?

Yes, but you will wind up initializing timepicker each and every time that timepicker is clicked.

Fortunately, some plugins ([timepicker included][timepickerInit]) have a safety mechanism for this but you should probably stay on the safe side of the fence.
----------------------

[timepicker]: http://jdewit.github.com/bootstrap-timepicker/
[timepickerInit]: https://github.com/jdewit/bootstrap-timepicker/blob/796688ba405916186aeae4326165b219f4c6659d/js/bootstrap-timepicker.js#L780-L782
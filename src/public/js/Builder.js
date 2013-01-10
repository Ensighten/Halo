/*! Builder - v0.1.0 - 2013-01-09
* https://github.com/Ensighten/Builder
* Copyright (c) 2013 Ensighten; Licensed MIT */

define(['jquery'], function ($) {

// jQuery flavored settings for Builder
var settings = {
      'template engine': function (tmpl) {
        return tmpl;
      },
      'dom engine': function (content) {
        return $(content);
      }
    };

// Create storage for before and after functions
var beforeFns = [],
    afterFns = [];

/**
 * Build chain for client side views. before -> template -> domify -> after -> return
 * @param {String} tmpl Template to process through template engine
 * @param {Object} [data] Data to pass through to template engine
 * @returns {Mixed} Output from before -> template -> domify -> after -> return
 */
function Builder(tmpl, data) {
  // Generate a this context for data
  var that = {'tmpl': tmpl, 'data': data};

  // Run the beforeFns on tmpl
  tmpl = pre.call(that, tmpl);

  // Convert the template into content
  var content = template.call(that, tmpl, data);

  // Pass the template through the dom engine
  var $content = domify.call(that, content);

  // Run the afterFns on $content
  $content = post.call(that, $content);

  // Return the $content
  return $content;
}

/**
 * Modify tmpl via beforeFns
 * @param {String} tmpl Template string to modify
 * @returns {String} Modified tmpl
 */
function pre(tmpl) {
  // Iterate over the beforeFns
  var i = 0,
      len = beforeFns.length;
  for (; i < len; i++) {
    tmpl = beforeFns[i].call(this, tmpl) || tmpl;
  }

  // Return tmpl
  return tmpl;
}
Builder.pre = pre;
Builder.beforeFns = beforeFns;

/**
 * Parse template through its engine
 * @param {String} tmpl Template to process through template engine
 * @param {Object} [data] Data to pass through to template engine
 */
function template(tmpl, data) {
  // Grab the template engine
  var engine = settings['template engine'];

  // Process the template through the template engine
  var content = engine.call(this, tmpl, data);

  // Return the content
  return content;
}
Builder.template = template;

/**
 * Convert HTML into HTMLElements, jQuery elements, or other
 * @param {String} content HTML to pass through dom engine
 */
function domify(content) {
  // Grab the dom engine
  var engine = settings['dom engine'];

  // Process the content through the dom engine
  var $content = engine.call(this, content);

  // Return the $content
  return $content;
}
Builder.domify = domify;

/**
 * Modify $content via afterFns
 * @param {String} $content Content to modify
 * @returns {String} Modified $content
 */
function post($content) {
  // Iterate over the afterFns
  var i = 0,
      len = afterFns.length;
  for (; i < len; i++) {
    $content = afterFns[i].call(this, $content) || $content;
  }

  // Return tmpl
  return $content;
}
Builder.post = post;
Builder.afterFns = afterFns;

/**
 * Settings helper for Builder
 * @param {String|Object} name If object, interpret as key-value pairs of settings. If string, save val under settings key.
 * @param {Mixed} [val] Value to save under name
 */
function set(name, val) {
  // If the name is an object
  var key;
  if (typeof name === 'object') {
    // Iterate over its properties
    for (key in name) {
      if (name.hasOwnProperty(key)) {
        // Set each one
        set(key, name[key]);
      }
    }
  } else {
  // Otherwise, save to settings
    settings[name] = val;
  }
}
Builder.set = set;
Builder.settings = settings;

/**
 * Helper method for saving new before methods
 * @param {Function} fn Before method to add
 */
function before(fn) {
  beforeFns.push(fn);
}
Builder.before = before;

/**
 * Helper method for saving new after methods
 * @param {Function} fn After method to add
 */
function after(fn) {
  afterFns.push(fn);
}
Builder.after = after;

/**
 * Initialize jQuery plugins after rendering
 * @param {String|Object} params If a string, it will be used for params.plugin and we will search elements which use it as a class
 * @param {String} params.plugin jQuery plugin to instantiate
 * @param {Mixed} params.selector Selector to use within $content.filter and $content.find
 */
function addPlugin(params) {
  // If the params are a string, upcast it to an object
  if (typeof params === 'string') {
    params = {
      'plugin': params
    };
  }

  // Grab and fallback plugin and selector
  var plugin = params.plugin,
      selector = params.selector || '.' + plugin;

  // Generate an after function for binding
  var afterFn = function pluginAfterFn($content) {
    // Filter and find any jQuery module that has the corresponding class
    var $items = $().add($content.filter(selector)).add($content.find(selector));

    // Iterate over the items and initialize the plugin
    $items.each(function () {
      $(this)[plugin]();
    });
  };

  // Bind the after function
  after(afterFn);
}
Builder.addPlugin = addPlugin;


return Builder;

});
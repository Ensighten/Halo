/*
 * Halo
 * https://github.com/Ensighten/Halo
 *
 * Copyright (c) 2013 Todd Wolfson
 * Licensed under the MIT license.
 */

// Collection method.
$.fn.awesome = function() {
  return this.each(function(i) {
    // Do something awesome to each selected element.
    $(this).html('awesome' + i);
  });
};
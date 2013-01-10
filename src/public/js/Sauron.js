/*! Sauron - v1.1.0 - 2013-01-07
* https://github.com/Ensighten/Sauron
* Copyright (c) 2013 Ensighten; Licensed MIT */

define(function () {
return (function () {
  var MiddleEarth = {},
      Sauron = {},
      console = window.console || {'log': function () {}};

  /**
   * Found this goodie on wiki: (Palantir == Seeing Stone)
   * http://en.wikipedia.org/wiki/Palant%C3%ADr
   */
  function Palantir() {
    this.stack = [];
  }
  function popStack() {
    return this.stack.pop();
  }
  var PalantirProto = Palantir.prototype = {
    /**
     * Retrieval function for the current channel
     * @param {Boolean} raw If true, prefixing will be skipped
     * @returns {String}
     */
    'channel': function (raw) {
      var stack = this.stack,
          prefix = this._prefix,
          controller = this._controller,
          model = this._model,
          channel = stack[stack.length - 1] || '';

      // If we don't want a raw channel
      if (!raw) {
        // If there is a prefix, use it
        if (prefix !== undefined) {
          channel = prefix + '/' + channel;
        }

        // If there is a controller, prefix the channel
        if (controller !== undefined) {
          channel = 'controller/' + controller + '/' + channel;
        } else if (model !== undefined) {
        // Otherwise, if there is a model, prefix the channel
          channel = 'model/' + model + '/' + channel;
        }
      }

      return channel;
    },
    /**
     * Maintenance functions for the stack of channels
     * @returns {String}
     */
    'pushStack': function (channel) {
      this.stack.push(channel);
      return this;
    },
    'popStack': popStack,
    'end': function () {
      var that = this.clone();
      popStack.call(that);
      return that;
    },
    'of': function (subchannel) {
      var that = this.clone(),
          lastChannel = that.channel(true),
          channel = lastChannel + '/' + subchannel;

      that.pushStack(channel);

      that.log('CHANNEL EDITED: ', that.channel());

      return that;
    },
    /**
     * Subscribing function for event listeners
     * @param {String} [subchannel] Subchannel to listen to
     * @param {Function} [fn] Function to subscribe with
     * @returns {this.clone}
     */
    'on': function (subchannel, fn) {
      var that = this.clone();

      // Move the track to do an 'on' action
      if (that.method !== 'on') {
        that.method = 'on';
        that.log('METHOD CHANGED TO: on');
      }

      // If there are are arguments
      if (arguments.length > 0) {
        // If there is only one argument and subchannel is a function, promote the subchannel to fn
        if (arguments.length === 1 && typeof subchannel === 'function') {
          fn = subchannel;
          subchannel = null;
        }

        // If there is a subchannel, add it to the current channel
        if (subchannel || subchannel === 0) {
          that = that.of(subchannel);
        }

        // If there is a function
        if (fn) {
          // Get the proper channel
          var channelName = that.channel(),
              channel = MiddleEarth[channelName];

          that.log('FUNCTION ADDED TO: ', channelName);

          // If the channel does not exist, create it
          if (channel === undefined) {
            channel = [];
            MiddleEarth[channelName] = channel;
          }

          // Save the function to this and context to the function
          that.fn = fn;
          fn.SAURON_CONTEXT = that;

          // Add the function to the channel
          channel.push(fn);

          /* let the clone be returned so callers can easily unsubscribe their events
          // This is a terminal event so return Sauron
          return Sauron;
          */
        }
      }

      // Return a clone
      return that;
    },
    /**
     * Unsubscribing function for event listeners
     * @param {String} [subchannel] Subchannel to unsubscribe from to
     * @param {Function} [fn] Function to remove subscription on
     * @returns {this.clone}
     */
    'off': function (subchannel, fn) {
      var that = this.clone();

      // Move the track to do an 'off' action
      if (that.method !== 'off') {
        that.method = 'off';
        that.log('METHOD CHANGED TO: off');
      }
      // If there are are arguments or there is a function
      fn = fn || that.fn;

      if (arguments.length > 0 || fn) {
        // If there is only one argument and subchannel is a function, promote the subchannel to fn
        if (arguments.length === 1 && typeof subchannel === 'function') {
          fn = subchannel;
          subchannel = null;
        }

        // If there is a subchannel, add it to the current channel
        if (subchannel || subchannel === 0) {
          that = that.of(subchannel);
        }

        // If there is a function
        var channelName = that.channel();
        if (fn) {
          // Get the proper channel
          var channel = MiddleEarth[channelName] || [],
              i = channel.length;

          that.log('REMOVING FUNCTION FROM: ', channelName);

          // Loop through the subscribers
          while (i--) {
            // If an functions match, remove them
            if (channel[i] === fn) {
              channel.splice(i, 1);
            }
          }

          // This is a terminal event so return Sauron
          return Sauron;
        } else {
        // Otherwise, unbind all items from the channel
          MiddleEarth[channelName] = [];
        }
      }

      // Return a clone
      return that;
    },
    /**
     * Voice/emit command for Sauron
     * @param {String|null} subchannel Subchannel to call on. If it is falsy, it will be skipped
     * @param {Mixed} [param] Parameter to voice to the channel. There can be infinite of these
     * @returns {Sauron}
     */
    'voice': function (subchannel/*, param, ... */) {
      var that = this.clone();

      // If there is a subchannel, use it
      if (subchannel || subchannel === 0) {
        that = that.of(subchannel);
      }

      // Collect the data and channel
      var args = [].slice.call(arguments, 1),
          channelName = that.channel(),
      // Capture the subscribers in case of self-removal (e.g. once)
          channel = (MiddleEarth[channelName] || []).slice(),
          subscriber,
          i = 0,
          len = channel.length;

      that.log('EXECUTING FUNCTIONS IN: ', channelName);

      // Loop through the subscribers
      for (; i < len; i++) {
        subscriber = channel[i];

        // Call the function within its original context
        subscriber.apply(subscriber.SAURON_CONTEXT, args);
      }

      // This is a terminal event so return Sauron
      return Sauron;
    },
    /**
     * Returns a cloned copy of this
     * @returns {this.clone}
     */
    'clone': function () {
      var that = this,
          retObj = new Palantir(),
          key;

      for (key in that) {
        if (that.hasOwnProperty(key)) {
          retObj[key] = that[key];
        }
      }

      // Special treatment for the stack
      retObj.stack = [].slice.call(that.stack);

      // Return the modified item
      return retObj;
    },
    /**
     * Sugar subscribe function that listens to an event exactly once
     * @param {String} [subchannel] Subchannel to listen to
     * @param {Function} [fn] Function to subscribe with
     * @returns {this.clone}
     */
    'once': function (subchannel, fn) {
      var that = this.clone();

      // Move the track to do an 'on' action
      that.method = 'once';

      // If there are arguments
      if (arguments.length > 0) {
        // If there is only one argument and subchannel is a function, promote the subchannel to fn
        if (arguments.length === 1 && typeof subchannel === 'function') {
          fn = subchannel;
          subchannel = null;
        }

        // If there is no function, throw an error
        if (typeof fn !== 'function') {
          throw new Error('Sauron.once expected a function, received: ' + fn.toString);
        }

        // Upcast the function for subscription
        var subFn = function () {
          // Unsubcribe from this
          this.off();

          // Call the function in this context
          var args = [].slice.call(arguments);
          return fn.apply(this, args);
        };

        // Call .on and return
        return that.on(subchannel, subFn);
      }

      // Return a clone
      return that;
    },

    // New hotness for creation/deletion
    'make': function () {
      var that = this.clone();

      that.log('PREFIX UPDATED TO: make');
      that._prefix = 'make';

      // If there are arguments, perform the normal action
      if (arguments.length > 0) {
        var args = [].slice.call(arguments),
            method = that.method || 'voice';

        return that[method].apply(that, args);
      } else {
      // Otherwise, return that
        return that;
      }
    },
    'destroy': function () {
      var that = this.clone();

      that.log('PREFIX UPDATED TO: destroy');
      that._prefix = 'destroy';

      // If there are arguments, perform the normal action
      if (arguments.length > 0) {
        var args = [].slice.call(arguments),
            method = that.method || 'voice';

        return that[method].apply(that, args);
      } else {
      // Otherwise, return that
        return that;
      }
    },

    // Controller methods
    /**
     * Fluent method for calling out a controller
     * @param {String} controller Name of the controller to invoke
     * @param {Mixed} * If there are any arguments, they will be passed to (on, off, once, voice) for invocation
     * @returns {Mixed} If there are more arguments than controller, the (on, off, once, voice) response will be returned. Otherwise, this.clone
     */
    'controller': function (controller) {
      var that = this.clone();

      that._controller = controller;

      // this.log('CONTROLLER UPDATED TO:', controller);
      that.log('CHANNEL UPDATED TO:', that.channel());

      // If require is present
      if (require) {
        var controllerUrl = require.getContext().config.paths._controllerDir || '',
            url = controllerUrl + controller;

        // If the controller has not yet been loaded by requirejs, notify
        if (!require.has(url)) {
          console.log(controller + ' has not been loaded by requirejs');
        }
      }

      if (arguments.length > 1) {
        var args = [].slice.call(arguments, 1),
            method = that.method || 'voice';
        args.unshift(null);
        return that[method].apply(that, args);
      } else {
      // Otherwise, return a clone
        return that;
      }
    },
    'createController': function (controller) {
      var that = this.clone();

      that = that.make();
      that = that.controller(controller);

      var args = [].slice.call(arguments, 1),
          method = that.method || 'voice';
      args.unshift(null);
      return that[method].apply(that, args);
    },
    'start': execFn('start'),
    'stop': execFn('stop'),

    // Model methods
    'model': function (model) {
      var that = this.clone();

      that._model = model;

      // this.log('MODEL UPDATED TO:', model);
      that.log('CHANNEL UPDATED TO:', that.channel());

      // If require is present
      if (require) {
        var modelUrl = require.getContext().config.paths._modelDir || '',
            url = modelUrl + model;

        // If the controller has not yet been loaded by requirejs, notify
        if (!require.has(url)) {
          console.log(model + ' has not been loaded by requirejs');
        }
      }

      if (arguments.length > 1) {
        var args = [].slice.call(arguments, 1),
            method = that.method || 'voice';
        args.unshift(null);
        return that[method].apply(that, args);
      } else {
      // Otherwise, return a clone
        return that;
      }
    },
    'createModel': function (model) {
      var that = this.clone();

      that = that.make();
      that = that.model(model);

      var args = [].slice.call(arguments, 1),
          method = that.method || 'voice';
      args.unshift(null);
      return that[method].apply(that, args);
    },
    'create': execFn('create'),
    'retrieve': execFn('retrieve'),
    'update': execFn('update'),
    'delete': execFn('delete'),
    'createEvent': execFn('createEvent'),
    'retrieveEvent': execFn('retrieveEvent'),
    'updateEvent': execFn('updateEvent'),
    'deleteEvent': execFn('deleteEvent'),

    /**
     * Helper function for error first callbacks. If an error occurs, we will log it and not call the function.
     * @param {Function} fn Function to remove error for
     * @returns {Function}
     */
    'noError': function (fn) {
      return function (err) {
        // If an error occurred, log it and don't do anything else
        if (err) { return console.error(err); }

        // Otherwise, callback with the remaining arguments
        var args = [].slice.call(arguments, 1);
        fn.apply(this, args);
      };
    },

    // Debug functions
    /**
     * Setter function for debugging
     * @param {Boolean} debug If true, turn debugger on. Otherwise, leave it off
     * @returns {this}
     */
    'debug': function (debug) {
      var that = this.clone();
      that._debug = debug;
      return that;
    },
    /**
     * Debug logger for this object
     * @returns {this}
     */
    'log': function () {
      if (this._debug === true || Sauron._debug === true) {
        console.log.apply(console, arguments);
      }
      return this;
    }
  };

  function execFn(subchannel) {
    return function () {
      var that = this.clone();

      // Add subchannel to the channel
      that = that.of(subchannel);

      // If there are arguments, perform the normal action
      if (arguments.length > 0) {
        var args = [].slice.call(arguments),
            method = that.method || 'voice';

        // If the method is voice, unshift an empty subchannel
        args.unshift(null);

        return that[method].apply(that, args);
      } else {
      // Otherwise, return a clone
        return that;
      }
    };
  }

  // Copy over all of the items in the Palantir prototype to Sauron such that each one is run on a fresh Palantir
  for (var key in PalantirProto) {
    if (PalantirProto.hasOwnProperty(key)) {
      (function (fn) {
        Sauron[key] = function () {
          var args = [].slice.call(arguments);
          return fn.apply(new Palantir(), args);
        };
      }(PalantirProto[key]));
    }
  }

  return Sauron;
}());
});
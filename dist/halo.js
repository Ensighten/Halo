/*! Halo - v1.0.0 - 2013-01-14
* https://github.com/Ensighten/Halo
* Copyright (c) 2013 Ensighten; Licensed MIT */

/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 2.1.2 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
//Not using strict: uneven strict support in browsers, #392, and causes
//problems with requirejs.exec()/transpiler plugins that may not be strict.
/*jslint regexp: true, nomen: true, sloppy: true */
/*global window, navigator, document, importScripts, jQuery, setTimeout, opera */

var requirejs, require, define;
(function (global) {
    var req, s, head, baseElement, dataMain, src,
        interactiveScript, currentlyAddingScript, mainScript, subPath,
        version = '2.1.2',
        commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
        cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
        jsSuffixRegExp = /\.js$/,
        currDirRegExp = /^\.\//,
        op = Object.prototype,
        ostring = op.toString,
        hasOwn = op.hasOwnProperty,
        ap = Array.prototype,
        aps = ap.slice,
        apsp = ap.splice,
        isBrowser = !!(typeof window !== 'undefined' && navigator && document),
        isWebWorker = !isBrowser && typeof importScripts !== 'undefined',
        //PS3 indicates loaded and complete, but need to wait for complete
        //specifically. Sequence is 'loading', 'loaded', execution,
        // then 'complete'. The UA check is unfortunate, but not sure how
        //to feature test w/o causing perf issues.
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
                      /^complete$/ : /^(complete|loaded)$/,
        defContextName = '_',
        //Oh the tragedy, detecting opera. See the usage of isOpera for reason.
        isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
        contexts = {},
        cfg = {},
        globalDefQueue = [],
        useInteractive = false;

    function isFunction(it) {
        return ostring.call(it) === '[object Function]';
    }

    function isArray(it) {
        return ostring.call(it) === '[object Array]';
    }

    /**
     * Helper function for iterating over an array. If the func returns
     * a true value, it will break out of the loop.
     */
    function each(ary, func) {
        if (ary) {
            var i;
            for (i = 0; i < ary.length; i += 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    /**
     * Helper function for iterating over an array backwards. If the func
     * returns a true value, it will break out of the loop.
     */
    function eachReverse(ary, func) {
        if (ary) {
            var i;
            for (i = ary.length - 1; i > -1; i -= 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    function getOwn(obj, prop) {
        return hasProp(obj, prop) && obj[prop];
    }

    /**
     * Cycles over properties in an object and calls a function for each
     * property value. If the function returns a truthy value, then the
     * iteration is stopped.
     */
    function eachProp(obj, func) {
        var prop;
        for (prop in obj) {
            if (hasProp(obj, prop)) {
                if (func(obj[prop], prop)) {
                    break;
                }
            }
        }
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     */
    function mixin(target, source, force, deepStringMixin) {
        if (source) {
            eachProp(source, function (value, prop) {
                if (force || !hasProp(target, prop)) {
                    if (deepStringMixin && typeof value !== 'string') {
                        if (!target[prop]) {
                            target[prop] = {};
                        }
                        mixin(target[prop], value, force, deepStringMixin);
                    } else {
                        target[prop] = value;
                    }
                }
            });
        }
        return target;
    }

    //Similar to Function.prototype.bind, but the 'this' object is specified
    //first, since it is easier to read/figure out what 'this' will be.
    function bind(obj, fn) {
        return function () {
            return fn.apply(obj, arguments);
        };
    }

    function scripts() {
        return document.getElementsByTagName('script');
    }

    //Allow getting a global that expressed in
    //dot notation, like 'a.b.c'.
    function getGlobal(value) {
        if (!value) {
            return value;
        }
        var g = global;
        each(value.split('.'), function (part) {
            g = g[part];
        });
        return g;
    }

    /**
     * Constructs an error with a pointer to an URL with more information.
     * @param {String} id the error ID that maps to an ID on a web page.
     * @param {String} message human readable error.
     * @param {Error} [err] the original error, if there is one.
     *
     * @returns {Error}
     */
    function makeError(id, msg, err, requireModules) {
        var e = new Error(msg + '\nhttp://requirejs.org/docs/errors.html#' + id);
        e.requireType = id;
        e.requireModules = requireModules;
        if (err) {
            e.originalError = err;
        }
        return e;
    }

    if (typeof define !== 'undefined') {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    if (typeof requirejs !== 'undefined') {
        if (isFunction(requirejs)) {
            //Do not overwrite and existing requirejs instance.
            return;
        }
        cfg = requirejs;
        requirejs = undefined;
    }

    //Allow for a require config object
    if (typeof require !== 'undefined' && !isFunction(require)) {
        //assume it is a config object.
        cfg = require;
        require = undefined;
    }

    function newContext(contextName) {
        var inCheckLoaded, Module, context, handlers,
            checkLoadedTimeoutId,
            config = {
                waitSeconds: 7,
                baseUrl: './',
                paths: {},
                pkgs: {},
                shim: {},
                map: {},
                config: {}
            },
            registry = {},
            undefEvents = {},
            defQueue = [],
            defined = {},
            urlFetched = {},
            requireCounter = 1,
            unnormalizedCounter = 1;

        /**
         * Trims the . and .. from an array of path segments.
         * It will keep a leading path segment if a .. will become
         * the first path segment, to help with module name lookups,
         * which act like paths, but can be remapped. But the end result,
         * all paths that use this function should look normalized.
         * NOTE: this method MODIFIES the input array.
         * @param {Array} ary the array of path segments.
         */
        function trimDots(ary) {
            var i, part;
            for (i = 0; ary[i]; i += 1) {
                part = ary[i];
                if (part === '.') {
                    ary.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    if (i === 1 && (ary[2] === '..' || ary[0] === '..')) {
                        //End of the line. Keep at least one non-dot
                        //path segment at the front so it can be mapped
                        //correctly to disk. Otherwise, there is likely
                        //no path mapping for a path starting with '..'.
                        //This can still fail, but catches the most reasonable
                        //uses of ..
                        break;
                    } else if (i > 0) {
                        ary.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
        }

        /**
         * Given a relative module name, like ./something, normalize it to
         * a real name that can be mapped to a path.
         * @param {String} name the relative name
         * @param {String} baseName a real name that the name arg is relative
         * to.
         * @param {Boolean} applyMap apply the map config to the value. Should
         * only be done if this normalization is for a dependency ID.
         * @returns {String} normalized name
         */
        function normalize(name, baseName, applyMap) {
            var pkgName, pkgConfig, mapValue, nameParts, i, j, nameSegment,
                foundMap, foundI, foundStarMap, starI,
                baseParts = baseName && baseName.split('/'),
                normalizedBaseParts = baseParts,
                map = config.map,
                starMap = map && map['*'];

            //Adjust any relative paths.
            if (name && name.charAt(0) === '.') {
                //If have a base name, try to normalize against it,
                //otherwise, assume it is a top-level require that will
                //be relative to baseUrl in the end.
                if (baseName) {
                    if (getOwn(config.pkgs, baseName)) {
                        //If the baseName is a package name, then just treat it as one
                        //name to concat the name with.
                        normalizedBaseParts = baseParts = [baseName];
                    } else {
                        //Convert baseName to array, and lop off the last part,
                        //so that . matches that 'directory' and not name of the baseName's
                        //module. For instance, baseName of 'one/two/three', maps to
                        //'one/two/three.js', but we want the directory, 'one/two' for
                        //this normalization.
                        normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                    }

                    name = normalizedBaseParts.concat(name.split('/'));
                    trimDots(name);

                    //Some use of packages may use a . path to reference the
                    //'main' module name, so normalize for that.
                    pkgConfig = getOwn(config.pkgs, (pkgName = name[0]));
                    name = name.join('/');
                    if (pkgConfig && name === pkgName + '/' + pkgConfig.main) {
                        name = pkgName;
                    }
                } else if (name.indexOf('./') === 0) {
                    // No baseName, so this is ID is resolved relative
                    // to baseUrl, pull off the leading dot.
                    name = name.substring(2);
                }
            }

            //Apply map config if available.
            if (applyMap && (baseParts || starMap) && map) {
                nameParts = name.split('/');

                for (i = nameParts.length; i > 0; i -= 1) {
                    nameSegment = nameParts.slice(0, i).join('/');

                    if (baseParts) {
                        //Find the longest baseName segment match in the config.
                        //So, do joins on the biggest to smallest lengths of baseParts.
                        for (j = baseParts.length; j > 0; j -= 1) {
                            mapValue = getOwn(map, baseParts.slice(0, j).join('/'));

                            //baseName segment has config, find if it has one for
                            //this name.
                            if (mapValue) {
                                mapValue = getOwn(mapValue, nameSegment);
                                if (mapValue) {
                                    //Match, update name to the new value.
                                    foundMap = mapValue;
                                    foundI = i;
                                    break;
                                }
                            }
                        }
                    }

                    if (foundMap) {
                        break;
                    }

                    //Check for a star map match, but just hold on to it,
                    //if there is a shorter segment match later in a matching
                    //config, then favor over this star map.
                    if (!foundStarMap && starMap && getOwn(starMap, nameSegment)) {
                        foundStarMap = getOwn(starMap, nameSegment);
                        starI = i;
                    }
                }

                if (!foundMap && foundStarMap) {
                    foundMap = foundStarMap;
                    foundI = starI;
                }

                if (foundMap) {
                    nameParts.splice(0, foundI, foundMap);
                    name = nameParts.join('/');
                }
            }

            return name;
        }

        function removeScript(name) {
            if (isBrowser) {
                each(scripts(), function (scriptNode) {
                    if (scriptNode.getAttribute('data-requiremodule') === name &&
                            scriptNode.getAttribute('data-requirecontext') === context.contextName) {
                        scriptNode.parentNode.removeChild(scriptNode);
                        return true;
                    }
                });
            }
        }

        function hasPathFallback(id) {
            var pathConfig = getOwn(config.paths, id);
            if (pathConfig && isArray(pathConfig) && pathConfig.length > 1) {
                removeScript(id);
                //Pop off the first array value, since it failed, and
                //retry
                pathConfig.shift();
                context.require.undef(id);
                context.require([id]);
                return true;
            }
        }

        //Turns a plugin!resource to [plugin, resource]
        //with the plugin being undefined if the name
        //did not have a plugin prefix.
        function splitPrefix(name) {
            var prefix,
                index = name ? name.indexOf('!') : -1;
            if (index > -1) {
                prefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
            }
            return [prefix, name];
        }

        /**
         * Creates a module mapping that includes plugin prefix, module
         * name, and path. If parentModuleMap is provided it will
         * also normalize the name via require.normalize()
         *
         * @param {String} name the module name
         * @param {String} [parentModuleMap] parent module map
         * for the module name, used to resolve relative names.
         * @param {Boolean} isNormalized: is the ID already normalized.
         * This is true if this call is done for a define() module ID.
         * @param {Boolean} applyMap: apply the map config to the ID.
         * Should only be true if this map is for a dependency.
         *
         * @returns {Object}
         */
        function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
            var url, pluginModule, suffix, nameParts,
                prefix = null,
                parentName = parentModuleMap ? parentModuleMap.name : null,
                originalName = name,
                isDefine = true,
                normalizedName = '';

            //If no name, then it means it is a require call, generate an
            //internal name.
            if (!name) {
                isDefine = false;
                name = '_@r' + (requireCounter += 1);
            }

            nameParts = splitPrefix(name);
            prefix = nameParts[0];
            name = nameParts[1];

            if (prefix) {
                prefix = normalize(prefix, parentName, applyMap);
                pluginModule = getOwn(defined, prefix);
            }

            //Account for relative paths if there is a base name.
            if (name) {
                if (prefix) {
                    if (pluginModule && pluginModule.normalize) {
                        //Plugin is loaded, use its normalize method.
                        normalizedName = pluginModule.normalize(name, function (name) {
                            return normalize(name, parentName, applyMap);
                        });
                    } else {
                        normalizedName = normalize(name, parentName, applyMap);
                    }
                } else {
                    //A regular module.
                    normalizedName = normalize(name, parentName, applyMap);

                    //Normalized name may be a plugin ID due to map config
                    //application in normalize. The map config values must
                    //already be normalized, so do not need to redo that part.
                    nameParts = splitPrefix(normalizedName);
                    prefix = nameParts[0];
                    normalizedName = nameParts[1];
                    isNormalized = true;

                    url = context.nameToUrl(normalizedName);
                }
            }

            //If the id is a plugin id that cannot be determined if it needs
            //normalization, stamp it with a unique ID so two matching relative
            //ids that may conflict can be separate.
            suffix = prefix && !pluginModule && !isNormalized ?
                     '_unnormalized' + (unnormalizedCounter += 1) :
                     '';

            return {
                prefix: prefix,
                name: normalizedName,
                parentMap: parentModuleMap,
                unnormalized: !!suffix,
                url: url,
                originalName: originalName,
                isDefine: isDefine,
                id: (prefix ?
                        prefix + '!' + normalizedName :
                        normalizedName) + suffix
            };
        }

        function getModule(depMap) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (!mod) {
                mod = registry[id] = new context.Module(depMap);
            }

            return mod;
        }

        function on(depMap, name, fn) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (hasProp(defined, id) &&
                    (!mod || mod.defineEmitComplete)) {
                if (name === 'defined') {
                    fn(defined[id]);
                }
            } else {
                getModule(depMap).on(name, fn);
            }
        }

        function onError(err, errback) {
            var ids = err.requireModules,
                notified = false;

            if (errback) {
                errback(err);
            } else {
                each(ids, function (id) {
                    var mod = getOwn(registry, id);
                    if (mod) {
                        //Set error on module, so it skips timeout checks.
                        mod.error = err;
                        if (mod.events.error) {
                            notified = true;
                            mod.emit('error', err);
                        }
                    }
                });

                if (!notified) {
                    req.onError(err);
                }
            }
        }

        /**
         * Internal method to transfer globalQueue items to this context's
         * defQueue.
         */
        function takeGlobalQueue() {
            //Push all the globalDefQueue items into the context's defQueue
            if (globalDefQueue.length) {
                //Array splice in the values since the context code has a
                //local var ref to defQueue, so cannot just reassign the one
                //on context.
                apsp.apply(defQueue,
                           [defQueue.length - 1, 0].concat(globalDefQueue));
                globalDefQueue = [];
            }
        }

        handlers = {
            'require': function (mod) {
                if (mod.require) {
                    return mod.require;
                } else {
                    return (mod.require = context.makeRequire(mod.map));
                }
            },
            'exports': function (mod) {
                mod.usingExports = true;
                if (mod.map.isDefine) {
                    if (mod.exports) {
                        return mod.exports;
                    } else {
                        return (mod.exports = defined[mod.map.id] = {});
                    }
                }
            },
            'module': function (mod) {
                if (mod.module) {
                    return mod.module;
                } else {
                    return (mod.module = {
                        id: mod.map.id,
                        uri: mod.map.url,
                        config: function () {
                            return (config.config && getOwn(config.config, mod.map.id)) || {};
                        },
                        exports: defined[mod.map.id]
                    });
                }
            }
        };

        function cleanRegistry(id) {
            //Clean up machinery used for waiting modules.
            delete registry[id];
        }

        function breakCycle(mod, traced, processed) {
            var id = mod.map.id;

            if (mod.error) {
                mod.emit('error', mod.error);
            } else {
                traced[id] = true;
                each(mod.depMaps, function (depMap, i) {
                    var depId = depMap.id,
                        dep = getOwn(registry, depId);

                    //Only force things that have not completed
                    //being defined, so still in the registry,
                    //and only if it has not been matched up
                    //in the module already.
                    if (dep && !mod.depMatched[i] && !processed[depId]) {
                        if (getOwn(traced, depId)) {
                            mod.defineDep(i, defined[depId]);
                            mod.check(); //pass false?
                        } else {
                            breakCycle(dep, traced, processed);
                        }
                    }
                });
                processed[id] = true;
            }
        }

        function checkLoaded() {
            var map, modId, err, usingPathFallback,
                waitInterval = config.waitSeconds * 1000,
                //It is possible to disable the wait interval by using waitSeconds of 0.
                expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                noLoads = [],
                reqCalls = [],
                stillLoading = false,
                needCycleCheck = true;

            //Do not bother if this call was a result of a cycle break.
            if (inCheckLoaded) {
                return;
            }

            inCheckLoaded = true;

            //Figure out the state of all the modules.
            eachProp(registry, function (mod) {
                map = mod.map;
                modId = map.id;

                //Skip things that are not enabled or in error state.
                if (!mod.enabled) {
                    return;
                }

                if (!map.isDefine) {
                    reqCalls.push(mod);
                }

                if (!mod.error) {
                    //If the module should be executed, and it has not
                    //been inited and time is up, remember it.
                    if (!mod.inited && expired) {
                        if (hasPathFallback(modId)) {
                            usingPathFallback = true;
                            stillLoading = true;
                        } else {
                            noLoads.push(modId);
                            removeScript(modId);
                        }
                    } else if (!mod.inited && mod.fetched && map.isDefine) {
                        stillLoading = true;
                        if (!map.prefix) {
                            //No reason to keep looking for unfinished
                            //loading. If the only stillLoading is a
                            //plugin resource though, keep going,
                            //because it may be that a plugin resource
                            //is waiting on a non-plugin cycle.
                            return (needCycleCheck = false);
                        }
                    }
                }
            });

            if (expired && noLoads.length) {
                //If wait time expired, throw error of unloaded modules.
                err = makeError('timeout', 'Load timeout for modules: ' + noLoads, null, noLoads);
                err.contextName = context.contextName;
                return onError(err);
            }

            //Not expired, check for a cycle.
            if (needCycleCheck) {
                each(reqCalls, function (mod) {
                    breakCycle(mod, {}, {});
                });
            }

            //If still waiting on loads, and the waiting load is something
            //other than a plugin resource, or there are still outstanding
            //scripts, then just try back later.
            if ((!expired || usingPathFallback) && stillLoading) {
                //Something is still waiting to load. Wait for it, but only
                //if a timeout is not already in effect.
                if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
                    checkLoadedTimeoutId = setTimeout(function () {
                        checkLoadedTimeoutId = 0;
                        checkLoaded();
                    }, 50);
                }
            }

            inCheckLoaded = false;
        }

        Module = function (map) {
            this.events = getOwn(undefEvents, map.id) || {};
            this.map = map;
            this.shim = getOwn(config.shim, map.id);
            this.depExports = [];
            this.depMaps = [];
            this.depMatched = [];
            this.pluginMaps = {};
            this.depCount = 0;

            /* this.exports this.factory
               this.depMaps = [],
               this.enabled, this.fetched
            */
        };

        Module.prototype = {
            init: function (depMaps, factory, errback, options) {
                options = options || {};

                //Do not do more inits if already done. Can happen if there
                //are multiple define calls for the same module. That is not
                //a normal, common case, but it is also not unexpected.
                if (this.inited) {
                    return;
                }

                this.factory = factory;

                if (errback) {
                    //Register for errors on this module.
                    this.on('error', errback);
                } else if (this.events.error) {
                    //If no errback already, but there are error listeners
                    //on this module, set up an errback to pass to the deps.
                    errback = bind(this, function (err) {
                        this.emit('error', err);
                    });
                }

                //Do a copy of the dependency array, so that
                //source inputs are not modified. For example
                //"shim" deps are passed in here directly, and
                //doing a direct modification of the depMaps array
                //would affect that config.
                this.depMaps = depMaps && depMaps.slice(0);

                this.errback = errback;

                //Indicate this module has be initialized
                this.inited = true;

                this.ignore = options.ignore;

                //Could have option to init this module in enabled mode,
                //or could have been previously marked as enabled. However,
                //the dependencies are not known until init is called. So
                //if enabled previously, now trigger dependencies as enabled.
                if (options.enabled || this.enabled) {
                    //Enable this module and dependencies.
                    //Will call this.check()
                    this.enable();
                } else {
                    this.check();
                }
            },

            defineDep: function (i, depExports) {
                //Because of cycles, defined callback for a given
                //export can be called more than once.
                if (!this.depMatched[i]) {
                    this.depMatched[i] = true;
                    this.depCount -= 1;
                    this.depExports[i] = depExports;
                }
            },

            fetch: function () {
                if (this.fetched) {
                    return;
                }
                this.fetched = true;

                context.startTime = (new Date()).getTime();

                var map = this.map;

                //If the manager is for a plugin managed resource,
                //ask the plugin to load it now.
                if (this.shim) {
                    context.makeRequire(this.map, {
                        enableBuildCallback: true
                    })(this.shim.deps || [], bind(this, function () {
                        return map.prefix ? this.callPlugin() : this.load();
                    }));
                } else {
                    //Regular dependency.
                    return map.prefix ? this.callPlugin() : this.load();
                }
            },

            load: function () {
                var url = this.map.url;

                //Regular dependency.
                if (!urlFetched[url]) {
                    urlFetched[url] = true;
                    context.load(this.map.id, url);
                }
            },

            /**
             * Checks is the module is ready to define itself, and if so,
             * define it.
             */
            check: function () {
                if (!this.enabled || this.enabling) {
                    return;
                }

                var err, cjsModule,
                    id = this.map.id,
                    depExports = this.depExports,
                    exports = this.exports,
                    factory = this.factory;

                if (!this.inited) {
                    this.fetch();
                } else if (this.error) {
                    this.emit('error', this.error);
                } else if (!this.defining) {
                    //The factory could trigger another require call
                    //that would result in checking this module to
                    //define itself again. If already in the process
                    //of doing that, skip this work.
                    this.defining = true;

                    if (this.depCount < 1 && !this.defined) {
                        if (isFunction(factory)) {
                            //If there is an error listener, favor passing
                            //to that instead of throwing an error.
                            if (this.events.error) {
                                try {
                                    exports = context.execCb(id, factory, depExports, exports);
                                } catch (e) {
                                    err = e;
                                }
                            } else {
                                exports = context.execCb(id, factory, depExports, exports);
                            }

                            if (this.map.isDefine) {
                                //If setting exports via 'module' is in play,
                                //favor that over return value and exports. After that,
                                //favor a non-undefined return value over exports use.
                                cjsModule = this.module;
                                if (cjsModule &&
                                        cjsModule.exports !== undefined &&
                                        //Make sure it is not already the exports value
                                        cjsModule.exports !== this.exports) {
                                    exports = cjsModule.exports;
                                } else if (exports === undefined && this.usingExports) {
                                    //exports already set the defined value.
                                    exports = this.exports;
                                }
                            }

                            if (err) {
                                err.requireMap = this.map;
                                err.requireModules = [this.map.id];
                                err.requireType = 'define';
                                return onError((this.error = err));
                            }

                        } else {
                            //Just a literal value
                            exports = factory;
                        }

                        this.exports = exports;

                        if (this.map.isDefine && !this.ignore) {
                            defined[id] = exports;

                            if (req.onResourceLoad) {
                                req.onResourceLoad(context, this.map, this.depMaps);
                            }
                        }

                        //Clean up
                        delete registry[id];

                        this.defined = true;
                    }

                    //Finished the define stage. Allow calling check again
                    //to allow define notifications below in the case of a
                    //cycle.
                    this.defining = false;

                    if (this.defined && !this.defineEmitted) {
                        this.defineEmitted = true;
                        this.emit('defined', this.exports);
                        this.defineEmitComplete = true;
                    }

                }
            },

            callPlugin: function () {
                var map = this.map,
                    id = map.id,
                    //Map already normalized the prefix.
                    pluginMap = makeModuleMap(map.prefix);

                //Mark this as a dependency for this plugin, so it
                //can be traced for cycles.
                this.depMaps.push(pluginMap);

                on(pluginMap, 'defined', bind(this, function (plugin) {
                    var load, normalizedMap, normalizedMod,
                        name = this.map.name,
                        parentName = this.map.parentMap ? this.map.parentMap.name : null,
                        localRequire = context.makeRequire(map.parentMap, {
                            enableBuildCallback: true,
                            skipMap: true
                        });

                    //If current map is not normalized, wait for that
                    //normalized name to load instead of continuing.
                    if (this.map.unnormalized) {
                        //Normalize the ID if the plugin allows it.
                        if (plugin.normalize) {
                            name = plugin.normalize(name, function (name) {
                                return normalize(name, parentName, true);
                            }) || '';
                        }

                        //prefix and name should already be normalized, no need
                        //for applying map config again either.
                        normalizedMap = makeModuleMap(map.prefix + '!' + name,
                                                      this.map.parentMap);
                        on(normalizedMap,
                            'defined', bind(this, function (value) {
                                this.init([], function () { return value; }, null, {
                                    enabled: true,
                                    ignore: true
                                });
                            }));

                        normalizedMod = getOwn(registry, normalizedMap.id);
                        if (normalizedMod) {
                            //Mark this as a dependency for this plugin, so it
                            //can be traced for cycles.
                            this.depMaps.push(normalizedMap);

                            if (this.events.error) {
                                normalizedMod.on('error', bind(this, function (err) {
                                    this.emit('error', err);
                                }));
                            }
                            normalizedMod.enable();
                        }

                        return;
                    }

                    load = bind(this, function (value) {
                        this.init([], function () { return value; }, null, {
                            enabled: true
                        });
                    });

                    load.error = bind(this, function (err) {
                        this.inited = true;
                        this.error = err;
                        err.requireModules = [id];

                        //Remove temp unnormalized modules for this module,
                        //since they will never be resolved otherwise now.
                        eachProp(registry, function (mod) {
                            if (mod.map.id.indexOf(id + '_unnormalized') === 0) {
                                cleanRegistry(mod.map.id);
                            }
                        });

                        onError(err);
                    });

                    //Allow plugins to load other code without having to know the
                    //context or how to 'complete' the load.
                    load.fromText = bind(this, function (text, textAlt) {
                        /*jslint evil: true */
                        var moduleName = map.name,
                            moduleMap = makeModuleMap(moduleName),
                            hasInteractive = useInteractive;

                        //As of 2.1.0, support just passing the text, to reinforce
                        //fromText only being called once per resource. Still
                        //support old style of passing moduleName but discard
                        //that moduleName in favor of the internal ref.
                        if (textAlt) {
                            text = textAlt;
                        }

                        //Turn off interactive script matching for IE for any define
                        //calls in the text, then turn it back on at the end.
                        if (hasInteractive) {
                            useInteractive = false;
                        }

                        //Prime the system by creating a module instance for
                        //it.
                        getModule(moduleMap);

                        //Transfer any config to this other module.
                        if (hasProp(config.config, id)) {
                            config.config[moduleName] = config.config[id];
                        }

                        try {
                            req.exec(text);
                        } catch (e) {
                            throw new Error('fromText eval for ' + moduleName +
                                            ' failed: ' + e);
                        }

                        if (hasInteractive) {
                            useInteractive = true;
                        }

                        //Mark this as a dependency for the plugin
                        //resource
                        this.depMaps.push(moduleMap);

                        //Support anonymous modules.
                        context.completeLoad(moduleName);

                        //Bind the value of that module to the value for this
                        //resource ID.
                        localRequire([moduleName], load);
                    });

                    //Use parentName here since the plugin's name is not reliable,
                    //could be some weird string with no path that actually wants to
                    //reference the parentName's path.
                    plugin.load(map.name, localRequire, load, config);
                }));

                context.enable(pluginMap, this);
                this.pluginMaps[pluginMap.id] = pluginMap;
            },

            enable: function () {
                this.enabled = true;

                //Set flag mentioning that the module is enabling,
                //so that immediate calls to the defined callbacks
                //for dependencies do not trigger inadvertent load
                //with the depCount still being zero.
                this.enabling = true;

                //Enable each dependency
                each(this.depMaps, bind(this, function (depMap, i) {
                    var id, mod, handler;

                    if (typeof depMap === 'string') {
                        //Dependency needs to be converted to a depMap
                        //and wired up to this module.
                        depMap = makeModuleMap(depMap,
                                               (this.map.isDefine ? this.map : this.map.parentMap),
                                               false,
                                               !this.skipMap);
                        this.depMaps[i] = depMap;

                        handler = getOwn(handlers, depMap.id);

                        if (handler) {
                            this.depExports[i] = handler(this);
                            return;
                        }

                        this.depCount += 1;

                        on(depMap, 'defined', bind(this, function (depExports) {
                            this.defineDep(i, depExports);
                            this.check();
                        }));

                        if (this.errback) {
                            on(depMap, 'error', this.errback);
                        }
                    }

                    id = depMap.id;
                    mod = registry[id];

                    //Skip special modules like 'require', 'exports', 'module'
                    //Also, don't call enable if it is already enabled,
                    //important in circular dependency cases.
                    if (!hasProp(handlers, id) && mod && !mod.enabled) {
                        context.enable(depMap, this);
                    }
                }));

                //Enable each plugin that is used in
                //a dependency
                eachProp(this.pluginMaps, bind(this, function (pluginMap) {
                    var mod = getOwn(registry, pluginMap.id);
                    if (mod && !mod.enabled) {
                        context.enable(pluginMap, this);
                    }
                }));

                this.enabling = false;

                this.check();
            },

            on: function (name, cb) {
                var cbs = this.events[name];
                if (!cbs) {
                    cbs = this.events[name] = [];
                }
                cbs.push(cb);
            },

            emit: function (name, evt) {
                each(this.events[name], function (cb) {
                    cb(evt);
                });
                if (name === 'error') {
                    //Now that the error handler was triggered, remove
                    //the listeners, since this broken Module instance
                    //can stay around for a while in the registry.
                    delete this.events[name];
                }
            }
        };

        function callGetModule(args) {
            //Skip modules already defined.
            if (!hasProp(defined, args[0])) {
                getModule(makeModuleMap(args[0], null, true)).init(args[1], args[2]);
            }
        }

        function removeListener(node, func, name, ieName) {
            //Favor detachEvent because of IE9
            //issue, see attachEvent/addEventListener comment elsewhere
            //in this file.
            if (node.detachEvent && !isOpera) {
                //Probably IE. If not it will throw an error, which will be
                //useful to know.
                if (ieName) {
                    node.detachEvent(ieName, func);
                }
            } else {
                node.removeEventListener(name, func, false);
            }
        }

        /**
         * Given an event from a script node, get the requirejs info from it,
         * and then removes the event listeners on the node.
         * @param {Event} evt
         * @returns {Object}
         */
        function getScriptData(evt) {
            //Using currentTarget instead of target for Firefox 2.0's sake. Not
            //all old browsers will be supported, but this one was easy enough
            //to support and still makes sense.
            var node = evt.currentTarget || evt.srcElement;

            //Remove the listeners once here.
            removeListener(node, context.onScriptLoad, 'load', 'onreadystatechange');
            removeListener(node, context.onScriptError, 'error');

            return {
                node: node,
                id: node && node.getAttribute('data-requiremodule')
            };
        }

        function intakeDefines() {
            var args;

            //Any defined modules in the global queue, intake them now.
            takeGlobalQueue();

            //Make sure any remaining defQueue items get properly processed.
            while (defQueue.length) {
                args = defQueue.shift();
                if (args[0] === null) {
                    return onError(makeError('mismatch', 'Mismatched anonymous define() module: ' + args[args.length - 1]));
                } else {
                    //args are id, deps, factory. Should be normalized by the
                    //define() function.
                    callGetModule(args);
                }
            }
        }

        context = {
            config: config,
            contextName: contextName,
            registry: registry,
            defined: defined,
            urlFetched: urlFetched,
            defQueue: defQueue,
            Module: Module,
            makeModuleMap: makeModuleMap,
            nextTick: req.nextTick,

            /**
             * Set a configuration for the context.
             * @param {Object} cfg config object to integrate.
             */
            configure: function (cfg) {
                //Make sure the baseUrl ends in a slash.
                if (cfg.baseUrl) {
                    if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== '/') {
                        cfg.baseUrl += '/';
                    }
                }

                //Save off the paths and packages since they require special processing,
                //they are additive.
                var pkgs = config.pkgs,
                    shim = config.shim,
                    objs = {
                        paths: true,
                        config: true,
                        map: true
                    };

                eachProp(cfg, function (value, prop) {
                    if (objs[prop]) {
                        if (prop === 'map') {
                            mixin(config[prop], value, true, true);
                        } else {
                            mixin(config[prop], value, true);
                        }
                    } else {
                        config[prop] = value;
                    }
                });

                //Merge shim
                if (cfg.shim) {
                    eachProp(cfg.shim, function (value, id) {
                        //Normalize the structure
                        if (isArray(value)) {
                            value = {
                                deps: value
                            };
                        }
                        if ((value.exports || value.init) && !value.exportsFn) {
                            value.exportsFn = context.makeShimExports(value);
                        }
                        shim[id] = value;
                    });
                    config.shim = shim;
                }

                //Adjust packages if necessary.
                if (cfg.packages) {
                    each(cfg.packages, function (pkgObj) {
                        var location;

                        pkgObj = typeof pkgObj === 'string' ? { name: pkgObj } : pkgObj;
                        location = pkgObj.location;

                        //Create a brand new object on pkgs, since currentPackages can
                        //be passed in again, and config.pkgs is the internal transformed
                        //state for all package configs.
                        pkgs[pkgObj.name] = {
                            name: pkgObj.name,
                            location: location || pkgObj.name,
                            //Remove leading dot in main, so main paths are normalized,
                            //and remove any trailing .js, since different package
                            //envs have different conventions: some use a module name,
                            //some use a file name.
                            main: (pkgObj.main || 'main')
                                  .replace(currDirRegExp, '')
                                  .replace(jsSuffixRegExp, '')
                        };
                    });

                    //Done with modifications, assing packages back to context config
                    config.pkgs = pkgs;
                }

                //If there are any "waiting to execute" modules in the registry,
                //update the maps for them, since their info, like URLs to load,
                //may have changed.
                eachProp(registry, function (mod, id) {
                    //If module already has init called, since it is too
                    //late to modify them, and ignore unnormalized ones
                    //since they are transient.
                    if (!mod.inited && !mod.map.unnormalized) {
                        mod.map = makeModuleMap(id);
                    }
                });

                //If a deps array or a config callback is specified, then call
                //require with those args. This is useful when require is defined as a
                //config object before require.js is loaded.
                if (cfg.deps || cfg.callback) {
                    context.require(cfg.deps || [], cfg.callback);
                }
            },

            makeShimExports: function (value) {
                function fn() {
                    var ret;
                    if (value.init) {
                        ret = value.init.apply(global, arguments);
                    }
                    return ret || (value.exports && getGlobal(value.exports));
                }
                return fn;
            },

            makeRequire: function (relMap, options) {
                options = options || {};

                function localRequire(deps, callback, errback) {
                    var id, map, requireMod;

                    if (options.enableBuildCallback && callback && isFunction(callback)) {
                        callback.__requireJsBuild = true;
                    }

                    if (typeof deps === 'string') {
                        if (isFunction(callback)) {
                            //Invalid call
                            return onError(makeError('requireargs', 'Invalid require call'), errback);
                        }

                        //If require|exports|module are requested, get the
                        //value for them from the special handlers. Caveat:
                        //this only works while module is being defined.
                        if (relMap && hasProp(handlers, deps)) {
                            return handlers[deps](registry[relMap.id]);
                        }

                        //Synchronous access to one module. If require.get is
                        //available (as in the Node adapter), prefer that.
                        if (req.get) {
                            return req.get(context, deps, relMap);
                        }

                        //Normalize module name, if it contains . or ..
                        map = makeModuleMap(deps, relMap, false, true);
                        id = map.id;

                        if (!hasProp(defined, id)) {
                            return onError(makeError('notloaded', 'Module name "' +
                                        id +
                                        '" has not been loaded yet for context: ' +
                                        contextName +
                                        (relMap ? '' : '. Use require([])')));
                        }
                        return defined[id];
                    }

                    //Grab defines waiting in the global queue.
                    intakeDefines();

                    //Mark all the dependencies as needing to be loaded.
                    context.nextTick(function () {
                        //Some defines could have been added since the
                        //require call, collect them.
                        intakeDefines();

                        requireMod = getModule(makeModuleMap(null, relMap));

                        //Store if map config should be applied to this require
                        //call for dependencies.
                        requireMod.skipMap = options.skipMap;

                        requireMod.init(deps, callback, errback, {
                            enabled: true
                        });

                        checkLoaded();
                    });

                    return localRequire;
                }

                mixin(localRequire, {
                    isBrowser: isBrowser,

                    /**
                     * Converts a module name + .extension into an URL path.
                     * *Requires* the use of a module name. It does not support using
                     * plain URLs like nameToUrl.
                     */
                    toUrl: function (moduleNamePlusExt) {
                        var index = moduleNamePlusExt.lastIndexOf('.'),
                            ext = null;

                        if (index !== -1) {
                            ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
                            moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
                        }

                        return context.nameToUrl(normalize(moduleNamePlusExt,
                                                relMap && relMap.id, true), ext);
                    },

                    defined: function (id) {
                        return hasProp(defined, makeModuleMap(id, relMap, false, true).id);
                    },

                    specified: function (id) {
                        id = makeModuleMap(id, relMap, false, true).id;
                        return hasProp(defined, id) || hasProp(registry, id);
                    }
                });

                //Only allow undef on top level require calls
                if (!relMap) {
                    localRequire.undef = function (id) {
                        //Bind any waiting define() calls to this context,
                        //fix for #408
                        takeGlobalQueue();

                        var map = makeModuleMap(id, relMap, true),
                            mod = getOwn(registry, id);

                        delete defined[id];
                        delete urlFetched[map.url];
                        delete undefEvents[id];

                        if (mod) {
                            //Hold on to listeners in case the
                            //module will be attempted to be reloaded
                            //using a different config.
                            if (mod.events.defined) {
                                undefEvents[id] = mod.events;
                            }

                            cleanRegistry(id);
                        }
                    };
                }

                return localRequire;
            },

            /**
             * Called to enable a module if it is still in the registry
             * awaiting enablement. parent module is passed in for context,
             * used by the optimizer.
             */
            enable: function (depMap, parent) {
                var mod = getOwn(registry, depMap.id);
                if (mod) {
                    getModule(depMap).enable();
                }
            },

            /**
             * Internal method used by environment adapters to complete a load event.
             * A load event could be a script load or just a load pass from a synchronous
             * load call.
             * @param {String} moduleName the name of the module to potentially complete.
             */
            completeLoad: function (moduleName) {
                var found, args, mod,
                    shim = getOwn(config.shim, moduleName) || {},
                    shExports = shim.exports;

                takeGlobalQueue();

                while (defQueue.length) {
                    args = defQueue.shift();
                    if (args[0] === null) {
                        args[0] = moduleName;
                        //If already found an anonymous module and bound it
                        //to this name, then this is some other anon module
                        //waiting for its completeLoad to fire.
                        if (found) {
                            break;
                        }
                        found = true;
                    } else if (args[0] === moduleName) {
                        //Found matching define call for this script!
                        found = true;
                    }

                    callGetModule(args);
                }

                //Do this after the cycle of callGetModule in case the result
                //of those calls/init calls changes the registry.
                mod = getOwn(registry, moduleName);

                if (!found && !hasProp(defined, moduleName) && mod && !mod.inited) {
                    if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
                        if (hasPathFallback(moduleName)) {
                            return;
                        } else {
                            return onError(makeError('nodefine',
                                             'No define call for ' + moduleName,
                                             null,
                                             [moduleName]));
                        }
                    } else {
                        //A script that does not call define(), so just simulate
                        //the call for it.
                        callGetModule([moduleName, (shim.deps || []), shim.exportsFn]);
                    }
                }

                checkLoaded();
            },

            /**
             * Converts a module name to a file path. Supports cases where
             * moduleName may actually be just an URL.
             * Note that it **does not** call normalize on the moduleName,
             * it is assumed to have already been normalized. This is an
             * internal API, not a public one. Use toUrl for the public API.
             */
            nameToUrl: function (moduleName, ext) {
                var paths, pkgs, pkg, pkgPath, syms, i, parentModule, url,
                    parentPath;

                //If a colon is in the URL, it indicates a protocol is used and it is just
                //an URL to a file, or if it starts with a slash, contains a query arg (i.e. ?)
                //or ends with .js, then assume the user meant to use an url and not a module id.
                //The slash is important for protocol-less URLs as well as full paths.
                if (req.jsExtRegExp.test(moduleName)) {
                    //Just a plain path, not module name lookup, so just return it.
                    //Add extension if it is included. This is a bit wonky, only non-.js things pass
                    //an extension, this method probably needs to be reworked.
                    url = moduleName + (ext || '');
                } else {
                    //A module that needs to be converted to a path.
                    paths = config.paths;
                    pkgs = config.pkgs;

                    syms = moduleName.split('/');
                    //For each module name segment, see if there is a path
                    //registered for it. Start with most specific name
                    //and work up from it.
                    for (i = syms.length; i > 0; i -= 1) {
                        parentModule = syms.slice(0, i).join('/');
                        pkg = getOwn(pkgs, parentModule);
                        parentPath = getOwn(paths, parentModule);
                        if (parentPath) {
                            //If an array, it means there are a few choices,
                            //Choose the one that is desired
                            if (isArray(parentPath)) {
                                parentPath = parentPath[0];
                            }
                            syms.splice(0, i, parentPath);
                            break;
                        } else if (pkg) {
                            //If module name is just the package name, then looking
                            //for the main module.
                            if (moduleName === pkg.name) {
                                pkgPath = pkg.location + '/' + pkg.main;
                            } else {
                                pkgPath = pkg.location;
                            }
                            syms.splice(0, i, pkgPath);
                            break;
                        }
                    }

                    //Join the path parts together, then figure out if baseUrl is needed.
                    url = syms.join('/');
                    url += (ext || (/\?/.test(url) ? '' : '.js'));
                    url = (url.charAt(0) === '/' || url.match(/^[\w\+\.\-]+:/) ? '' : config.baseUrl) + url;
                }

                return config.urlArgs ? url +
                                        ((url.indexOf('?') === -1 ? '?' : '&') +
                                         config.urlArgs) : url;
            },

            //Delegates to req.load. Broken out as a separate function to
            //allow overriding in the optimizer.
            load: function (id, url) {
                req.load(context, id, url);
            },

            /**
             * Executes a module callack function. Broken out as a separate function
             * solely to allow the build system to sequence the files in the built
             * layer in the right sequence.
             *
             * @private
             */
            execCb: function (name, callback, args, exports) {
                return callback.apply(exports, args);
            },

            /**
             * callback for script loads, used to check status of loading.
             *
             * @param {Event} evt the event from the browser for the script
             * that was loaded.
             */
            onScriptLoad: function (evt) {
                //Using currentTarget instead of target for Firefox 2.0's sake. Not
                //all old browsers will be supported, but this one was easy enough
                //to support and still makes sense.
                if (evt.type === 'load' ||
                        (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
                    //Reset interactive script so a script node is not held onto for
                    //to long.
                    interactiveScript = null;

                    //Pull out the name of the module and the context.
                    var data = getScriptData(evt);
                    context.completeLoad(data.id);
                }
            },

            /**
             * Callback for script errors.
             */
            onScriptError: function (evt) {
                var data = getScriptData(evt);
                if (!hasPathFallback(data.id)) {
                    return onError(makeError('scripterror', 'Script error', evt, [data.id]));
                }
            }
        };

        context.require = context.makeRequire();
        return context;
    }

    /**
     * Main entry point.
     *
     * If the only argument to require is a string, then the module that
     * is represented by that string is fetched for the appropriate context.
     *
     * If the first argument is an array, then it will be treated as an array
     * of dependency string names to fetch. An optional function callback can
     * be specified to execute when all of those dependencies are available.
     *
     * Make a local req variable to help Caja compliance (it assumes things
     * on a require that are not standardized), and to give a short
     * name for minification/local scope use.
     */
    req = requirejs = function (deps, callback, errback, optional) {

        //Find the right context, use default
        var context, config,
            contextName = defContextName;

        // Determine if have config object in the call.
        if (!isArray(deps) && typeof deps !== 'string') {
            // deps is a config object
            config = deps;
            if (isArray(callback)) {
                // Adjust args if there are dependencies
                deps = callback;
                callback = errback;
                errback = optional;
            } else {
                deps = [];
            }
        }

        if (config && config.context) {
            contextName = config.context;
        }

        context = getOwn(contexts, contextName);
        if (!context) {
            context = contexts[contextName] = req.s.newContext(contextName);
        }

        if (config) {
            context.configure(config);
        }

        return context.require(deps, callback, errback);
    };

    /**
     * Support require.config() to make it easier to cooperate with other
     * AMD loaders on globally agreed names.
     */
    req.config = function (config) {
        return req(config);
    };

    /**
     * Execute something after the current tick
     * of the event loop. Override for other envs
     * that have a better solution than setTimeout.
     * @param  {Function} fn function to execute later.
     */
    req.nextTick = typeof setTimeout !== 'undefined' ? function (fn) {
        setTimeout(fn, 4);
    } : function (fn) { fn(); };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    if (!require) {
        require = req;
    }

    req.version = version;

    //Used to filter out dependencies that are already paths.
    req.jsExtRegExp = /^\/|:|\?|\.js$/;
    req.isBrowser = isBrowser;
    s = req.s = {
        contexts: contexts,
        newContext: newContext
    };

    //Create default context.
    req({});

    //Exports some context-sensitive methods on global require.
    each([
        'toUrl',
        'undef',
        'defined',
        'specified'
    ], function (prop) {
        //Reference from contexts instead of early binding to default context,
        //so that during builds, the latest instance of the default context
        //with its config gets used.
        req[prop] = function () {
            var ctx = contexts[defContextName];
            return ctx.require[prop].apply(ctx, arguments);
        };
    });

    if (isBrowser) {
        head = s.head = document.getElementsByTagName('head')[0];
        //If BASE tag is in play, using appendChild is a problem for IE6.
        //When that browser dies, this can be removed. Details in this jQuery bug:
        //http://dev.jquery.com/ticket/2709
        baseElement = document.getElementsByTagName('base')[0];
        if (baseElement) {
            head = s.head = baseElement.parentNode;
        }
    }

    /**
     * Any errors that require explicitly generates will be passed to this
     * function. Intercept/override it if you want custom error handling.
     * @param {Error} err the error object.
     */
    req.onError = function (err) {
        throw err;
    };

    /**
     * Does the request to load a module for the browser case.
     * Make this a separate function to allow other environments
     * to override it.
     *
     * @param {Object} context the require context to find state.
     * @param {String} moduleName the name of the module.
     * @param {Object} url the URL to the module.
     */
    req.load = function (context, moduleName, url) {
        var config = (context && context.config) || {},
            node;
        if (isBrowser) {
            //In the browser so use a script tag
            node = config.xhtml ?
                    document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') :
                    document.createElement('script');
            node.type = config.scriptType || 'text/javascript';
            node.charset = 'utf-8';
            node.async = true;

            node.setAttribute('data-requirecontext', context.contextName);
            node.setAttribute('data-requiremodule', moduleName);

            //Set up load listener. Test attachEvent first because IE9 has
            //a subtle issue in its addEventListener and script onload firings
            //that do not match the behavior of all other browsers with
            //addEventListener support, which fire the onload event for a
            //script right after the script execution. See:
            //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
            //UNFORTUNATELY Opera implements attachEvent but does not follow the script
            //script execution mode.
            if (node.attachEvent &&
                    //Check if node.attachEvent is artificially added by custom script or
                    //natively supported by browser
                    //read https://github.com/jrburke/requirejs/issues/187
                    //if we can NOT find [native code] then it must NOT natively supported.
                    //in IE8, node.attachEvent does not have toString()
                    //Note the test for "[native code" with no closing brace, see:
                    //https://github.com/jrburke/requirejs/issues/273
                    !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
                    !isOpera) {
                //Probably IE. IE (at least 6-8) do not fire
                //script onload right after executing the script, so
                //we cannot tie the anonymous define call to a name.
                //However, IE reports the script as being in 'interactive'
                //readyState at the time of the define call.
                useInteractive = true;

                node.attachEvent('onreadystatechange', context.onScriptLoad);
                //It would be great to add an error handler here to catch
                //404s in IE9+. However, onreadystatechange will fire before
                //the error handler, so that does not help. If addEvenListener
                //is used, then IE will fire error before load, but we cannot
                //use that pathway given the connect.microsoft.com issue
                //mentioned above about not doing the 'script execute,
                //then fire the script load event listener before execute
                //next script' that other browsers do.
                //Best hope: IE10 fixes the issues,
                //and then destroys all installs of IE 6-9.
                //node.attachEvent('onerror', context.onScriptError);
            } else {
                node.addEventListener('load', context.onScriptLoad, false);
                node.addEventListener('error', context.onScriptError, false);
            }
            node.src = url;

            //For some cache cases in IE 6-8, the script executes before the end
            //of the appendChild execution, so to tie an anonymous define
            //call to the module name (which is stored on the node), hold on
            //to a reference to this node, but clear after the DOM insertion.
            currentlyAddingScript = node;
            if (baseElement) {
                head.insertBefore(node, baseElement);
            } else {
                head.appendChild(node);
            }
            currentlyAddingScript = null;

            return node;
        } else if (isWebWorker) {
            //In a web worker, use importScripts. This is not a very
            //efficient use of importScripts, importScripts will block until
            //its script is downloaded and evaluated. However, if web workers
            //are in play, the expectation that a build has been done so that
            //only one script needs to be loaded anyway. This may need to be
            //reevaluated if other use cases become common.
            importScripts(url);

            //Account for anonymous modules
            context.completeLoad(moduleName);
        }
    };

    function getInteractiveScript() {
        if (interactiveScript && interactiveScript.readyState === 'interactive') {
            return interactiveScript;
        }

        eachReverse(scripts(), function (script) {
            if (script.readyState === 'interactive') {
                return (interactiveScript = script);
            }
        });
        return interactiveScript;
    }

    //Look for a data-main script attribute, which could also adjust the baseUrl.
    if (isBrowser) {
        //Figure out baseUrl. Get it from the script tag with require.js in it.
        eachReverse(scripts(), function (script) {
            //Set the 'head' where we can append children by
            //using the script's parent.
            if (!head) {
                head = script.parentNode;
            }

            //Look for a data-main attribute to set main script for the page
            //to load. If it is there, the path to data main becomes the
            //baseUrl, if it is not already set.
            dataMain = script.getAttribute('data-main');
            if (dataMain) {
                //Set final baseUrl if there is not already an explicit one.
                if (!cfg.baseUrl) {
                    //Pull off the directory of data-main for use as the
                    //baseUrl.
                    src = dataMain.split('/');
                    mainScript = src.pop();
                    subPath = src.length ? src.join('/')  + '/' : './';

                    cfg.baseUrl = subPath;
                    dataMain = mainScript;
                }

                //Strip off any trailing .js since dataMain is now
                //like a module name.
                dataMain = dataMain.replace(jsSuffixRegExp, '');

                //Put the data-main script in the files to load.
                cfg.deps = cfg.deps ? cfg.deps.concat(dataMain) : [dataMain];

                return true;
            }
        });
    }

    /**
     * The function that handles definitions of modules. Differs from
     * require() in that a string for the module should be the first argument,
     * and the function to execute after dependencies are loaded should
     * return a value to define the module corresponding to the first argument's
     * name.
     */
    define = function (name, deps, callback) {
        var node, context;

        //Allow for anonymous modules
        if (typeof name !== 'string') {
            //Adjust args appropriately
            callback = deps;
            deps = name;
            name = null;
        }

        //This module may not have dependencies
        if (!isArray(deps)) {
            callback = deps;
            deps = [];
        }

        //If no name, and callback is a function, then figure out if it a
        //CommonJS thing with dependencies.
        if (!deps.length && isFunction(callback)) {
            //Remove comments from the callback string,
            //look for require calls, and pull them into the dependencies,
            //but only if there are function args.
            if (callback.length) {
                callback
                    .toString()
                    .replace(commentRegExp, '')
                    .replace(cjsRequireRegExp, function (match, dep) {
                        deps.push(dep);
                    });

                //May be a CommonJS thing even without require calls, but still
                //could use exports, and module. Avoid doing exports and module
                //work though if it just needs require.
                //REQUIRES the function to expect the CommonJS variables in the
                //order listed below.
                deps = (callback.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(deps);
            }
        }

        //If in IE 6-8 and hit an anonymous define() call, do the interactive
        //work.
        if (useInteractive) {
            node = currentlyAddingScript || getInteractiveScript();
            if (node) {
                if (!name) {
                    name = node.getAttribute('data-requiremodule');
                }
                context = contexts[node.getAttribute('data-requirecontext')];
            }
        }

        //Always save off evaluating the def call until the script onload handler.
        //This allows multiple modules to be in a file without prematurely
        //tracing dependencies, and allows for anonymous module support,
        //where the module name is not known until the script onload event
        //occurs. If no context, use the global queue, and get it processed
        //in the onscript load callback.
        (context ? context.defQueue : globalDefQueue).push([name, deps, callback]);
    };

    define.amd = {
        jQuery: true
    };


    /**
     * Executes the text. Normally just uses eval, but can be modified
     * to use a better, environment-specific call. Only used for transpiling
     * loader plugins, not for plain JS modules.
     * @param {String} text the text to execute/evaluate.
     */
    req.exec = function (text) {
        /*jslint evil: true */
        return eval(text);
    };

    //Set up with config info.
    req(cfg);
}(this));

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
      if (require && require.getContext) {
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
      if (require && require.getContext) {
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
define(function () {
  return {
    'load': function (name, req, onLoad, config) {
      // Determine the type and localize paths
      var type = name.charAt(0),
          paths = config.paths,
          baseUrl = config.baseUrl || '';

      // Slice up string and set up fallbacks for path parts
      var file = name.substring(2),
          dir = '',
          prefix = '';

      // Load models and controllers as JS and views via the text plugin
      switch (type) {
        case 'm':
          dir = paths._modelDir || '../../models';
          ext = paths._modelExt || '.js';
          break;
        case 'v':
          prefix = 'text!';
          dir = paths._viewDir || '../../views';
          ext = paths._viewExt || '.html';
          break;
        case 'c':
          dir = paths._controllerDir || '../../controllers';
          ext = paths._controllerExt || '.js';
          break;
      }

      // Generate the URI to load
      var uri = prefix + baseUrl + dir + '/' + file + ext;

      // Load up the module and return it
      require([uri], onLoad);
    }
  };
});
define(['Sauron'], function (Sauron) {
  function noop() {}

  /**
   * Constructor function for general purpose controller
   * @param {Object} params Parameters for configuring the controller
   * @param {String} params.name Name of controller (used for Sauron)
   * @param {Function} [params.start] Function to run when the controller is started via Sauron
   * @param {Function} [params.stop] Function to run when the controller is stopped via Sauron
   */
  function BaseController(params, callback) {
    params = params || {};
    var name = params.name;

    if (!name) {
      throw Error('Must specify name for a controller');
    }

    var startFn = params.start,
        stopFn = params.stop;
    if (startFn !== undefined) {
      Sauron.on().controller(name).start(startFn);
    }

    if (stopFn !== undefined) {
      Sauron.on().controller(name).stop(stopFn);
    }

    // Callback on completion of controller
    (callback || noop)();
  }

  // Return the BaseController template
  return BaseController;
});
define(['Sauron', 'jquery', 'mvc!c/BaseController'], function (Sauron, $, BaseController) {
  function noop() {}
  function autoCallback(callback) {
    callback();
  }

  /**
   * Constructor function for HTML controller
   * @param {Object} params Parameters to load into controller
   * @param {String} params.name Name of controller (used for pub/sub)
   * @param {Function} [params.start] Pub/sub method for starting controller
   * @param {Function} [params.stop] Pub/sub method for stopping controller
   * @param {String|String[]} [params.mixin] Items to mixin to start and stop methods (currently none available)
   */
  function HtmlController(params, callback) {
    // If there are mixins specified
    var mixinKey = params.mixin,
        mixinKeys = mixinKey,
        mixin,
        i,
        len;
    if (mixinKeys !== undefined) {
      // If the mixinKeys are a string, upcast to an array
      if (typeof mixinKeys === 'string') {
        mixinKeys = [mixinKey];
      }

      // Iterate the mixinKeys and attach them to params
      for (i = 0, len = mixinKeys.length; i < len; i++) {
        mixinKey = mixinKeys[i];
        mixin = MIXINS[mixinKey];

        // If the mixin exists
        if (mixin !== undefined) {
          // Attach it to params
          params = mixin(params);
        }
      }
    }

    var start = params.start || autoCallback,
        stop  = params.stop || autoCallback,
        $html;

    // Overwrite start method
    params.start = function startHtmlControllerOverride (container) {
      // Collect all other arguments
      var args = [].slice.call(arguments, 1),
          argsLen = args.length,
          insertIndex = argsLen - 1,
          lastArg = args[argsLen - 1],
          callback = lastArg,
          $container = $(container);

      // If the last argument is not a callback
      if (typeof lastArg !== 'function') {
        // Overwrite the callback with noop and change the insertIndex
        callback = noop;
        insertIndex = argsLen;
      }

      // Inject our custom callback
      args[insertIndex] = function (html) {
        // Memoize arguments for callback
        var args = [].slice.call(arguments, 1);

        // Memoize $html for destruction
        $html = $(html);

        // Empty the previous container and callback when done
        $container.empty().append($html);

        // Announce that an insertion has occurred
        Sauron.voice('dom/insert', $html);

        // Callback with the arguments
        callback.apply(this, args);
      };

      // Invoke the original start method with our custom args
      start.apply(this, args);
    };

    // Overwrite stop method
    params.stop = function stopHtmlControllerOverride () {
      // Collect all arguments
      var args = [].slice.call(arguments),
          argsLen = args.length,
          insertIndex = argsLen - 1,
          lastArg = args[argsLen - 1],
          callback = lastArg;

      // If the last argument is not a callback
      if (typeof lastArg !== 'function') {
        // Overwrite the callback with noop and change the insertIndex
        callback = noop;
        insertIndex = argsLen;
      }

      // Inject callback
      args[insertIndex] = function callbackFn () {
        // Remove $html from its container
        $html.remove();

        // Announce completion of destruction
        return callback.apply(this, arguments);
      };

      // Invoke the original stop method with our custom args
      stop.apply(this, args);
    };

    // Generate and return BaseController from parameters
    return BaseController(params);
  }

  // Mixins placeholder
  var MIXINS = {};

  // Return HtmlController template
  return HtmlController;
});

define(['Sauron'], function (Sauron) {
  function noop() {}
  /**
   * Constructor for CRUD Model
   * @param {Object} params Parameters for configuring the model
   * @param {String} params.name Name of the model
   * @param {Function} [params.create] Function for creation in the model
   * @param {Function} [params.retrieve] Function for retrieving from the model
   * @param {Function} [params.update] Function for updates in the model
   * @param {Function} [params.delete] Function for deletion in the model
   * @param {String|String[]} [params.mixin] Items to mixin to the model (e.g. memory, persist)
   * @param {String} [params.persistKey] Subnamespace for persistent memory
   */
  function CrudModel(params, callback) {
    if ( !params ) { throw Error('You must give a params object when constructing a CrudModel'); }
    var name = params.name;

    if( !name ) {
      throw Error('Must specify name for a model');
    }

    // If there are mixins specified
    var mixinKey = params.mixin,
        mixinKeys = mixinKey,
        mixin,
        i,
        len;
    if (mixinKeys !== undefined) {
      // If the mixinKeys are a string, upcast to an array
      if (typeof mixinKeys === 'string') {
        mixinKeys = [mixinKey];
      }

      // Iterate the mixinKeys and attach them to params
      for (i = 0, len = mixinKeys.length; i < len; i++) {
        mixinKey = mixinKeys[i];
        mixin = MIXINS[mixinKey];

        // If the mixin exists
        if (mixin !== undefined) {
          // Attach it to params
          params = mixin(params);
        }
      }
    }

    // For each method, add a Sauron listener
    var create = params.create,
        retrieve = params.retrieve,
        update = params.update,
        del = params['delete'];
    if (create) {
      // Sauron.on().model().create(), .retrieve, ...
      Sauron.on().model(name).create(function () {
        // Type cast arguments for passing
        var args = [].slice.call(arguments);

        // Call start with all of our arguments and 'this' set to params (for socket + memory)
        create.apply(params, args);
      });
    }

    if (retrieve) {
      Sauron.on().model(name).retrieve(function () {
        var args = [].slice.call(arguments);
        retrieve.apply(params, args);
      });
    }

    if (update) {
      Sauron.on().model(name).update(function () {
        var args = [].slice.call(arguments);
        update.apply(params, args);
      });
    }

    if (del) {
      Sauron.on().model(name)['delete'](function () {
        var args = [].slice.call(arguments);
        del.apply(params, args);
      });
    }

    // Announce completion of creation
    (callback || noop)('CrudModel', params);

    // Return something
    return {};
  }

  var MIXINS = {
    'memory': function (params) {
      // Bind memory store to params
      var memory = {};
      params.memory = {
        'set': function (key, val) {
          memory[key] = val;
        },
        'get': function (key) {
          return memory[key];
        },
        'clear': function () {
          memory = {};
        }
      };

      // Return the modified params
      return params;
    }
  };

  // DEPRECATED: In very first iteration, we used asynchronous templating. Unfortunately, it disagreed with the synchronous require.js model.
  // // Subscribe to creation channel
  // Sauron.on().createModel('CrudModel', CrudModel);

  // Return model for proper timing currently
  return CrudModel;
});
/*global io:true*/
define(['Sauron', 'mvc!m/CrudModel', 'io'], function (Sauron, CrudModel) {
  // Create a socket which proxies all requests
  var href = window.location.href,
      isSecure = href.slice(0, 5) === 'https',
      mainSocket = io.connect('/', {'secure': isSecure});
  function noop() {}

  /**
   * Wrapped constructor for CrudModel with socket.io. The socket is accessible via this.socket.
   * @param {Object} params Param object
   * @param {Function} [params.channel] Channel to listen to in socket.io
   * @param {Function} [params.createEvent] Action to take for a create event from the server
   * @param {Function} [params.retrieveEvent] Action to take for a retrieve event from the server
   * @param {Function} [params.updateEvent] Action to take for an update event from the server
   * @param {Function} [params.deleteEvent] Action to take for an delete event from the server
   * @param {String|String[]} [params.mixin] Items to mixin to parameter (e.g. autoCRUD)
   * @see CrudModel
   */
  function SocketModel(params, callback) {
    // Verify params are supplied
    if (!params) {
      throw Error('You must pass in a parameters object for creating a model');
    }

    // Localize channel and create socket
    var name = params.name,
        channel = params.channel || name,
        socket = mainSocket.of(channel),
        _Sauron = Sauron.model(name);

    // Save the channel for mixins
    params.channel = channel;

    // Bind socket to params
    params.socket = socket;

    // If there are mixins specified
    var mixinKey = params.mixin,
        mixinKeys = mixinKey,
        mixin,
        i,
        len;
    if (mixinKeys !== undefined) {
      // If the mixinKeys are a string, upcast to an array
      if (typeof mixinKeys === 'string') {
        mixinKeys = [mixinKey];
      }

      // Iterate the mixinKeys and attach them to params
      for (i = 0, len = mixinKeys.length; i < len; i++) {
        mixinKey = mixinKeys[i];
        mixin = MIXINS[mixinKey];

        // If the mixin exists
        if (mixin !== undefined) {
          // Attach it to params
          params = mixin(params);
        }
      }
    }

    function bindMethod(method, methodName) {
      // If the method exists, execute it in the parameters context (access to socket)
      if (method) {
        socket.on(methodName, function () {
          // Invoke method on params object
          method.apply(params, arguments);
        });
      }

      // Always listen and announce the event
      socket.on(methodName, function () {
        _Sauron[methodName].apply(_Sauron, arguments);
      });
    }

    function execMethods(methodNameArr) {
      var methodName,
          i,
          method;

      // Iterate and execute the methods in order
      for( i = 0, len = methodNameArr.length; i < len; i++ ) {
        methodName = methodNameArr[i];
        method = params[methodName];

        bindMethod(method, methodName);
      }
    }

    // Set up all listeners
    // Anti-pattern: Iterating over an array to perform bindings
    execMethods(['createEvent', 'retrieveEvent', 'updateEvent', 'deleteEvent']);

    // Generate and return CrudModel
    return CrudModel(params, callback);
  }

  // Add sugar methods for sockets
  var Socket = io.Socket,
      SocketNS = io.SocketNamespace,
      bindTargetArr = [Socket, SocketNS],
      i = 0,
      len = bindTargetArr.length;

  function bindToSocketProto(Socket) {
    var SocketProto = Socket.prototype,
        SocketEmit = SocketProto.emit,
        SocketRequest;

    // Define socket.request which can serve as an injection point for global error handling
    SocketProto.request = SocketRequest = SocketEmit;

    // Define socket helpers which automatically specify channel
    SocketProto.create = function () {
      var args = [].slice.call(arguments);
      args.unshift('create');
      SocketRequest.apply(this, args);
    };

    SocketProto.retrieve = function () {
      var args = [].slice.call(arguments);
      args.unshift('retrieve');
      SocketRequest.apply(this, args);
    };

    SocketProto.update = function () {
      var args = [].slice.call(arguments);
      args.unshift('update');
      SocketRequest.apply(this, args);
    };

    SocketProto['delete'] = function () {
      var args = [].slice.call(arguments);
      args.unshift('delete');
      SocketRequest.apply(this, args);
    };
  }

  // Anti-pattern: Bind to both Socket and SocketNamespace prototypes
  for (; i < len; i++) {
    bindToSocketProto(bindTargetArr[i]);
  }

  // Set up mixins
  var MIXINS = {
    // If any CRUD method is not defined by model, fall it back to upstream requests to server
    'autoCRUD': function (params) {
      params.create = params.create || function autoSocketModelCreate () {
        var socket = this.socket;
        socket.create.apply(socket, arguments);
      };

      params.retrieve = params.retrieve || function autoSocketModelRetrieve () {
        var socket = this.socket;
        socket.retrieve.apply(socket, arguments);
      };

      params.update = params.update || function autoSocketModelUpdate () {
        var socket = this.socket;
        socket.update.apply(socket, arguments);
      };

      params['delete'] = params['delete'] || function autoSocketModelDelete () {
        var socket = this.socket;
        socket['delete'].apply(socket, arguments);
      };

      return params;
    }
  };

  return SocketModel;
});
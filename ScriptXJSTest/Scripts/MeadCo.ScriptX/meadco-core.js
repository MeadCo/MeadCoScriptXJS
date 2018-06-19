/*!
 * MeadCo.Core (support for modern browsers and IE 11) JS client library
 * Copyright 2017 Mead & Company. All rights reserved.
 * https://github.com/MeadCo/ScriptX.Print.Client
 *
 * Released under the MIT license
 */

// Extensible UMD Plugins 
// Ref: https://addyosmani.com/writing-modular-js/
//
// With fixes and changes : works with sparse namespaces
// and root implements the namespace build code as inheritable
// function 'extend()'
//  

// Module/Plugin core
// Note: the wrapper code you see around the module is what enables
// us to support multiple module formats and specifications by 
// mapping the arguments defined to what a specific format expects
// to be present. Our actual module functionality is defined lower 
// down. 

; (function (name, definition) {
    var theModule = definition(),
        // this is considered "safe":
        hasDefine = typeof define === 'function' && define.amd,
        // hasDefine = typeof define === 'function',
        hasExports = typeof module !== 'undefined' && module.exports;

    if (hasDefine) { // AMD Module
        define(theModule);
    } else if (hasExports) { // Node.js Module
        module.exports = theModule;
    } else { // Assign to common namespaces or simply the global object (window)
        // var scope = (this.jQuery || this.ender || this.$ || this);
        // we always go for window
        var scope = this;

        // hack ...
        //
        // MeadCo.ScriptX and MeadCo.Licensing may already be defined
        // when we run -- they would happily extend this implementation
        // and we should extend theirs. This is a horible way to do it.
        //
        var oldscope = null;
        if (typeof scope[name] !== 'undefined') {
            console.log(name + " already exists");
            oldscope = scope[name];
        }

        scope[name] = theModule;

        if (oldscope != null) {
            var newscope = scope[name];

            console.log("preserving old scope ... ");
            for (var prop in oldscope) {
                if (oldscope.hasOwnProperty(prop)) {
                    console.log("will preserve: " + prop);
                    newscope[prop] = oldscope[prop];
                }
            }
        }

        // this is moderately poor .. assuming this code is executing
        // as the root of the name space, which it is and assumes
        // it implements inheritable extendNamespace(), which it does.
        // For all that, it means that the root gets to decide where this
        // is (i.e. in a common namespace or the global object)
        theModule.scope = scope;
    }
})('MeadCo', function () {

    // protected API
    var module = this;
    var version = "1.4.8.0";

    var log = function (str) {
        console.log("MeadCo :: " + str);
    }

    var warn = function (str) {
        console.warn("MeadCo :: " + str);
    }

    var error = function (str) {
        console.error("MeadCo :: " + str);
    }

    // extend the namespace
    module.extendMeadCoNamespace = function (name, definition) {
        var theModule = definition(),
            hasDefine = typeof define === 'function' && define.amd,
            hasExports = typeof module !== 'undefined' && module.exports;

        if (hasDefine) { // AMD Module
            define(theModule);
        } else if (hasExports) { // Node.js Module
            module.exports = theModule;
        } else {
            log("MeadCo root extending namespace: " + name);
            // walk/build the namespace part by part and assign the module to the leaf
            var namespaces = name.split(".");
            var scope = (module.scope || this.jQuery || this.ender || this.$ || this);
            for (var i = 0; i < namespaces.length; i++) {
                var packageName = namespaces[i];
                if (i === namespaces.length - 1) {
                    if (typeof scope[packageName] === "undefined") {
                        log("installing implementation at: " + packageName);
                        scope[packageName] = theModule;
                    } else {
                        log("Warning - extending package: " + packageName);
                        var oldscope = scope[packageName];
                        scope[packageName] = theModule;

                        var newscope = scope[packageName];

                        console.log("preserving old scope ... ");
                        for (var prop in oldscope) {
                            if (oldscope.hasOwnProperty(prop)) {
                                console.log("will preserve: " + prop);
                                newscope[prop] = oldscope[prop];
                            }
                        }
                    }
                } else if (typeof scope[packageName] === "undefined") {
                    log("initialising new: " + packageName);
                    scope[packageName] = {};
                } else {
                    log("using existing package: " + packageName);
                }
                scope = scope[packageName];
            }
        }
    }

    log("MeadCo root namespace loaded.");

    // public API.
    return {
        log: log,
        warn: warn,
        error: error,

        get version() { return version },

        // allow things such as MeadCo.createNS("MeadCo.ScriptX.Print.UI");
        createNS: function (namespace) {
            var nsparts = namespace.split(".");
            var parent = window.MeadCo;

            // we want to be able to include or exclude the root namespace so we strip
            // it if it's in the namespace
            if (nsparts[0] === "MeadCo") {
                nsparts = nsparts.slice(1);
            }

            // loop through the parts and create a nested namespace if necessary
            for (var i = 0; i < nsparts.length; i++) {
                var partname = nsparts[i];
                // check if the current parent already has the namespace declared
                // if it isn't, then create it
                if (typeof parent[partname] === "undefined") {
                    parent[partname] = {};
                }
                // get a reference to the deepest element in the hierarchy so far
                parent = parent[partname];
            }
            // the parent is now constructed with empty namespaces and can be used.
            // we return the outermost namespace
            return parent;
        },

        set scope(s) { module.scope = s; },

        makeApiEndPoint: function (serverUrl, apiLocation) {
            // check if given partial ...
            if (serverUrl.indexOf("/api/") === -1) {
                if (serverUrl.lastIndexOf("/") !== (serverUrl.length - 1)) {
                    serverUrl += "/";
                }
                serverUrl += "api/" + apiLocation;
            }
            return serverUrl;
        }
    };

});



/*!
 * MeadCo ScriptX 'window.secmgr' shim (support for modern browsers and IE 11) JS client library
 * Copyright 2017 Mead & Company. All rights reserved.
 * https://github.com/MeadCo/ScriptX.Print.Client
 *
 * Released under the MIT license
 */

// we anti-polyfill <object id="secmgr" /> 
// enabling old code to run in modern browsers
//
; (function (name, definition, undefined) {

    if (this[name] != undefined || document.getElementById(name) != null) {
        console.log("MeadCo security manager anti-polyfill believes it may not be requred.");
        if (this[name] != undefined) {
            console.log("this[" + name + "] is defined");
        }
        if (document.getElementById(name) != null) {
            console.log("document.getElementById(" + name + ") is defined");
        }
        if (this[name].object != undefined) {
            console.log("this[" + name + "].object is defined -- not required!!!");
            return;
        } else {
            console.log("this[" + name + "].object is *not* defined");
        }
    }

    var theModule = definition();

    // Assign to the global object (window)
    (this)[name] = theModule;

})('secmgr', function () {

    // protected API
    var moduleversion = "1.4.8.0";
    var emulatedVersion = "8.1.1.0";
    var module = this;

    // protected API
    var printApi = MeadCo.ScriptX.Print;
    var licenseApi = MeadCo.ScriptX.Print.Licensing;

    function log(str) {
        console.log("secmgr anti-polyfill :: " + str);
    }

    // extend the namespace
    module.extendSecMgrNamespace = function (name, definition) {
        var theModule = definition();

        log("MeadCo security manager extending namespace2: " + name);
        // walk/build the namespace part by part and assign the module to the leaf
        var namespaces = name.split(".");
        var scope = this;
        for (var i = 0; i < namespaces.length; i++) {
            var packageName = namespaces[i];
            if (i === namespaces.length - 1) {
                if (typeof scope[packageName] === "undefined") {
                    log("installing implementation at: " + packageName);
                    scope[packageName] = theModule;
                } else {
                    log("Warning - not overwriting package: " + packageName);
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

    log("'secmgr' loaded.");
    if (typeof licenseApi === "undefined" || licenseApi === null) {
        console.error("MeadCo.ScriptX.Print.Licensing not available");
    } 

    if (typeof printApi === "undefined" || printApi===null) {
        console.error("MeadCo.ScriptX.Print not available");
    } else {
        printApi.useAttributes();
    }

    // public API.
    return {
        log: log,
        get version() {
            return moduleversion;
        },

        get result() {
            return licenseApi.result;
        },

        get validLicense() {
            return licenseApi.validLicense;
        },

        get License() {
            return licenseApi.License;
        },

        GetLicenseAsync: function (resolve, reject) {
            licenseApi.GetLicenseAsync(resolve, reject);
        },

        // helpers for wrapper MeadCoJS - we apply the license here when working
        // with ScriptX.Services for Windows PC
        PolyfillInit: function () {
            return licenseApi.PolyfillInit();
        },

        PolyfillInitAsync: function (resolve, reject) {
            licenseApi.PolyfillInitAsync(resolve,reject);
        }
    };
});


; (function (name, definition) {
    if (typeof extendSecMgrNamespace === "function") {
        extendSecMgrNamespace(name, definition);
    }
})('secmgr.object', function () {

    // protected API
    var module = this;

    module.secmgr.log("secmgr.object loaded.");

    // public API
    return this.secmgr;
});

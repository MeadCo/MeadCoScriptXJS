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
; (function (name, definition,undefined) {

    if ( this[name] != undefined || document.getElementById(name) != null ) {
        console.log("MeadCo security manager anti-polyfill believes it may not be requred.");
        if ( this[name] != undefined ) {
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
    var moduleversion = "1.1.0.1";
    var emulatedVersion = "8.0.0.2";
    var module = this;
    var license = {};


    var server = "";            // url to the server
    var licenseGuid = "";

    function log (str) {
        console.log("secmgr anti-polyfill :: " + str);
    }

    function setLicensingServer(serverUrl, clientLicenseGuid) {
        MeadCo.log("Licensing server requested: " + serverUrl + " with license: " + clientLicenseGuid);
        server = serverUrl;
        licenseGuid = clientLicenseGuid;
    }

    function getLicenseFromServer(onFail) {

        if (server.length <= 0) {
            throw new Error("MeadCo.ScriptX.Licensing : licensing server URL is not set or is invalid");
        }

        if (module.jQuery) {
            MeadCo.log(".ajax() get: " + server);
            module.jQuery.ajax(server,
                {
                    method: "GET",
                    dataType: "json",
                    jsonp: false,
                    cache: false,
                    async: false, // TODO: deprecated 
                    headers: {
                        "Authorization": "Basic " + btoa(licenseGuid + ":")
                    }
                }).done(function (data) {
                    $.extend(license, data);
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    MeadCo.log("**warning: failure in MeadCo.ScriptX.Licensing.getLicenseFromServer: " + errorThrown);
                    if (typeof onFail == "function")
                        onFail(errorThrown);
                });
            return license;
        }
    }

    // extend the namespace
    module.extendSecMgrNamespace = function(name, definition) {
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

    // public API.
    return {
        log: log,
        get version() {
            return moduleversion;
        },

        get result() {
            return 0;
        },

        get validLicense() {
            return true;
        },

        get License() {
            var license = getLicenseFromServer();
            return license;
        },

        connect: setLicensingServer,

    };
});


; (function (name, definition) {
    if (typeof extendSecMgrNamespace === "function") {
        extendSecMgrNamespace(name, definition);
    }
})('secmgr.object', function () {

    // protected API
    var module = this;

    secmgr.log("secmgr.object loaded.");

    // public API
    return this.secmgr;
});

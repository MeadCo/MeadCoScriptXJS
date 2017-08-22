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
    var moduleversion = "1.1.0.4";
    var emulatedVersion = "8.0.0.2";
    var module = this;
    var license = {};
    var lastError = "Not loaded";

    var server = "";            // url to the server
    var licenseGuid = "";

    function log (str) {
        console.log("secmgr anti-polyfill :: " + str);
    }

    function setSubscriptionServer(serverUrl, clientLicenseGuid) {
        MeadCo.log("Subscription server requested: " + serverUrl + " with license: " + clientLicenseGuid);
        server = serverUrl;
        licenseGuid = clientLicenseGuid;
    }

    function getSubscriptionFromServer(resolve, reject) {

        if (server.length <= 0) {
            throw new Error("MeadCo.ScriptX.Licensing : Subscription server URL is not set or is invalid");
        }

        if (module.jQuery) {
            MeadCo.log(".ajax() get: " + server);
            module.jQuery.ajax(server,
                {
                    method: "GET",
                    dataType: "json",
                    jsonp: false,
                    cache: false,
                    async: typeof resolve === "function",
                    headers: {
                        "Authorization": "Basic " + btoa(licenseGuid + ":")
                    }
                }).done(function (data) {
                    lastError = "";
                    $.extend(license, data);
                    if (typeof resolve === "function")
                        resolve(license);
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    MeadCo.log("**warning: failure in MeadCo.ScriptX.Licensing.getSubscriptionFromServer: " + errorThrown);
                    lastError = errorThrown;
                    if (typeof reject == "function")
                        reject(errorThrown);
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

    if (this.jQuery) {
        MeadCo.log("Looking for auto connect");
        $("[data-meadco-subscriptionserver]").each(function () {
            var $this = $(this);
            MeadCo.log("Auto connect to: " + $this.data("meadco-subscriptionserver") + ", with license: " + $this.data("meadco-subscription") + ", sync: " + $this.data("meadco-syncinit"));
            var sync = ("" + $this.data("meadco-syncinit")).toLowerCase(); // defaults to true if not specified
            setSubscriptionServer($this.data("meadco-subscriptionserver"), $this.data("meadco-subscription"));
            return false;
        });
    }

    // public API.
    return {
        log: log,
        get version() {
            return moduleversion;
        },

        get result() {
            return lastError === "" ? 0 : 5; // => ok or not found
        },

        get validLicense() {
            return typeof license.Id !== "undefined";
        },

        get License() {
            var license = getSubscriptionFromServer();
            return license;
        },

        GetLicenseAsync: function(resolve, reject) {
            getSubscriptionFromServer(resolve, reject);
        },

        connect: setSubscriptionServer

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

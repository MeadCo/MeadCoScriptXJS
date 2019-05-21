/**
 * MeadCo ScriptX 'window.secmgr' shim (support for modern browsers and IE 11) JS client library
 *
 * The MeadCo Security Manager Add-on for Internet Explorer is included on a html document with an &lt;object id='secmgr' /&gt; element with a de-facto standard id of 'secmgr'.
 *
 * The object is referenced with the property window.secmgr which exposes properties and methods.
 * 
 * The MeadCo Security Manager Add-on for Internet Explorer provided for prompting the user to accept use of the license that enabled advanced features of ScriptX.Add-on. Frequently
 * there was then no further reference to Security Manager and in such cases this shim is not required.
 * 
 * This use case can be emulated by using appropriate attributes on an element (for example a &lt;script&gt;&lt;/script&gt;) on the page and including meadco-scriptxprint.js to process the attributes. This shim is then *not* required.
 * 
 * Please note that when working with ScriptX.Services for Windows PC meadco-scriptxprintlicensing.js is required even with the use of attributes.
 * 
 * This shim is required if you have code that relies upon being able to inspect the availability of a license.
 * 
 * Full documentation on the properties/methods is provided by the technical reference documentation for the ScriptX Add-on for Internet Explorer: https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/secmgr. That documentation is not reproduced here.
 *
 * If the startup script determines that the MeadCo Security Manager Add-on for IE is already active then it will quietly give priority to the object. In other words, the Add-on has precedence on Internet Explorer.
 *
 * This enables the same experience (almost) to be delivered to any browser on any device with the same html/javascript code.
 *
 * It is strongly recommended that the MeadCoScriptJS library (https://github.com/MeadCo/MeadCoScriptXJS) is used in conjunction with this library as it provides code (Promises) to assist
 * with working with the significant difference between the synchronous nature of the functions of ScriptX.Add-on (which hide the underlying asynchrony) and the asynchronous nature of javascript AJAX processing.
 * 
 *  Requires: 
 *  meadco-core.js
 *  meadco-scriptxprint.js
 *  meadco-scriptxprintlicensing.js
 *  
 * @namespace secmgr
 * 
 */

// we anti-polyfill &lt;object id="secmgr" /&gt;
// enabling old code to run in modern browsers
//
; (function (name, definition, undefined) {

    if (this[name] !== undefined || document.getElementById(name) !== null) {
        console.log("MeadCo security manager anti-polyfill believes it may not be requred.");
        if (this[name] !== undefined) {
            console.log("this[" + name + "] is defined");
        }
        if (document.getElementById(name) !== null) {
            console.log("document.getElementById(" + name + ") is defined");
        }
        if (this[name].object !== undefined) {
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
    var moduleversion = "1.5.8.0";
    var emulatedVersion = "8.2.0.0";
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
    };

    log("'secmgr' loaded.");
    if (typeof licenseApi.GetLicenseAsync !== "function" ) {
        console.error("MeadCo.ScriptX.Print.Licensing not available");
    } 

    if (typeof printApi.useAttributes !== "function" ) {
        console.error("MeadCo.ScriptX.Print not available");
    } else {
        printApi.useAttributes();
    }

    // public API.
    return {
        log: log,


        /**
         * Get the version of this module as a string major.minor.hotfix.build
         * @property {string} version
         * @memberof secmgr
         */
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

        /**
         * Get the details of the license using Asynchronous calls to the server.
         * See meadco-scriptxprintlicensing.js for more detail
         * @memberof secmgr
         * @function GetLicenseAsync
         * @param {function({license})} resolve function to call on successfulk completion
         * @param {function({string})} reject function to call on failure with reason for failure
         * 
         */
        GetLicenseAsync: function (resolve, reject) {
            licenseApi.GetLicenseAsync(resolve, reject);
        },

        // helpers for wrapper MeadCoJS - we apply the license here when working
        // with ScriptX Services for Windows PC
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

    /*
     * This completes the emulation of an  &lt;object /&gt; element
     *
     * Compatibility with Add-on to allow inspection of  &lt;object /&gt; and this javascript
     * for the underlying object implementing 'secmgr'.
     * 
     * @property {object} secmgr
     * @memberof secmgrobject
     */
    return this.secmgr;
});

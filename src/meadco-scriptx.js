// Copyright (c) 2013-2017, Mead & Company Ltd. All rights reserved.
//
// Use, reproduction, distribution, and modification of this code is subject to the terms and 
// conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
//
// Project: https://github.com/MeadCo/MeadCoScriptXJS
//
// If you fork, or make updates .. please let us know at feedback@meadroid.com
//
// A simple wrapper object on the MeadCo ScriptX printing object, aka factory.printing
//
// Going forward, use MeadCo.ScriptX.Printing
//
//////////////////////////////////////////////////////////////////////////////////////////////

// v1.3.0 and later introduce an async model to enable async scenarios with ScriptX.Print Services.
//
// v1.2.0 and later include support for working with MeadCo.ScriptX.Print via a polyfill
//  - include meadco-scriptxfactory.js before this file and call MeadCo.ScriptX.Print.HTML.connect() 
//  see https://github.com/MeadCo/ScriptX.Print.Client
//
//

//////////////////////////////////////////////////////////////////////////////////////////////
// Usage:
// 
// The library provides two objects within the MeadCo 'namespace':
//	ScriptX -- wraps the classic factory and factory.printing objects
//	Licensing -- wraps the MeadCo Security Manager object
//
// MeadCo.ScriptX
// --------------
// The <object /> tag for ScriptX factory is assumed to have an id of 'factory'
// call MeadCo.ScriptX.Init() - returns true on success.
//
// 2 objects will then be available:
//	MeadCo.ScriptX.Utils - the 'factory' object
//  	MeadCo.ScriptX.Printing - the 'factory.printing' object with all the properties and methods as documented.
//
// 	e.g. MeadCo.ScriptX.Printing.header = "My Report header";
//
// See the function help for more details
//
// MeadCo.Licensing
// ----------------
//
// The <object /> tag for MeadCo Security Manager is assumed to have an id of 'secmgr'
//
// call MeadCo.Licensing.IsLicensed() to test if the licensed is valid for the document and has been installed/accepted.
//
// if ( MeadCo.Licensing.IsLicensed() ) {
// 	...
// }
// else {
//	MeadCo.Licensing.ReportError();
// }

// https://github.com/taylorhakes/promise-polyfill
//
(function (root) {

    // Store setTimeout reference so promise-polyfill will be unaffected by
    // other code modifying setTimeout (like sinon.useFakeTimers())
    var setTimeoutFunc = setTimeout;

    function noop() { }

    // Polyfill for Function.prototype.bind
    function bind(fn, thisArg) {
        return function () {
            fn.apply(thisArg, arguments);
        };
    }

    function Promise(fn) {
        if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new');
        if (typeof fn !== 'function') throw new TypeError('not a function');
        this._state = 0;
        this._handled = false;
        this._value = undefined;
        this._deferreds = [];

        doResolve(fn, this);
    }

    function handle(self, deferred) {
        while (self._state === 3) {
            self = self._value;
        }
        if (self._state === 0) {
            self._deferreds.push(deferred);
            return;
        }
        self._handled = true;
        Promise._immediateFn(function () {
            var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
            if (cb === null) {
                (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
                return;
            }
            var ret;
            try {
                ret = cb(self._value);
            } catch (e) {
                reject(deferred.promise, e);
                return;
            }
            resolve(deferred.promise, ret);
        });
    }

    function resolve(self, newValue) {
        try {
            // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
            if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.');
            if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
                var then = newValue.then;
                if (newValue instanceof Promise) {
                    self._state = 3;
                    self._value = newValue;
                    finale(self);
                    return;
                } else if (typeof then === 'function') {
                    doResolve(bind(then, newValue), self);
                    return;
                }
            }
            self._state = 1;
            self._value = newValue;
            finale(self);
        } catch (e) {
            reject(self, e);
        }
    }

    function reject(self, newValue) {
        self._state = 2;
        self._value = newValue;
        finale(self);
    }

    function finale(self) {
        if (self._state === 2 && self._deferreds.length === 0) {
            Promise._immediateFn(function () {
                if (!self._handled) {
                    Promise._unhandledRejectionFn(self._value);
                }
            });
        }

        for (var i = 0, len = self._deferreds.length; i < len; i++) {
            handle(self, self._deferreds[i]);
        }
        self._deferreds = null;
    }

    function Handler(onFulfilled, onRejected, promise) {
        this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
        this.onRejected = typeof onRejected === 'function' ? onRejected : null;
        this.promise = promise;
    }

    /**
     * Take a potentially misbehaving resolver function and make sure
     * onFulfilled and onRejected are only called once.
     *
     * Makes no guarantees about asynchrony.
     */
    function doResolve(fn, self) {
        var done = false;
        try {
            fn(function (value) {
                if (done) return;
                done = true;
                resolve(self, value);
            }, function (reason) {
                if (done) return;
                done = true;
                reject(self, reason);
            });
        } catch (ex) {
            if (done) return;
            done = true;
            reject(self, ex);
        }
    }

    Promise.prototype['catch'] = function (onRejected) {
        return this.then(null, onRejected);
    };

    Promise.prototype.then = function (onFulfilled, onRejected) {
        var prom = new (this.constructor)(noop);

        handle(this, new Handler(onFulfilled, onRejected, prom));
        return prom;
    };

    Promise.all = function (arr) {
        var args = Array.prototype.slice.call(arr);

        return new Promise(function (resolve, reject) {
            if (args.length === 0) return resolve([]);
            var remaining = args.length;

            function res(i, val) {
                try {
                    if (val && (typeof val === 'object' || typeof val === 'function')) {
                        var then = val.then;
                        if (typeof then === 'function') {
                            then.call(val, function (val) {
                                res(i, val);
                            }, reject);
                            return;
                        }
                    }
                    args[i] = val;
                    if (--remaining === 0) {
                        resolve(args);
                    }
                } catch (ex) {
                    reject(ex);
                }
            }

            for (var i = 0; i < args.length; i++) {
                res(i, args[i]);
            }
        });
    };

    Promise.resolve = function (value) {
        if (value && typeof value === 'object' && value.constructor === Promise) {
            return value;
        }

        return new Promise(function (resolve) {
            resolve(value);
        });
    };

    Promise.reject = function (value) {
        return new Promise(function (resolve, reject) {
            reject(value);
        });
    };

    Promise.race = function (values) {
        return new Promise(function (resolve, reject) {
            for (var i = 0, len = values.length; i < len; i++) {
                values[i].then(resolve, reject);
            }
        });
    };

    // Use polyfill for setImmediate for performance gains
    Promise._immediateFn = (typeof setImmediate === 'function' && function (fn) { setImmediate(fn); }) ||
      function (fn) {
          setTimeoutFunc(fn, 0);
      };

    Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
        if (typeof console !== 'undefined' && console) {
            console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
        }
    };

    /**
     * Set the immediate function to execute callbacks
     * @param fn {function} Function to execute
     * @deprecated
     */
    Promise._setImmediateFn = function _setImmediateFn(fn) {
        Promise._immediateFn = fn;
    };

    /**
     * Change the function to execute on unhandled rejection
     * @param {function} fn Function to execute on unhandled rejection
     * @deprecated
     */
    Promise._setUnhandledRejectionFn = function _setUnhandledRejectionFn(fn) {
        Promise._unhandledRejectionFn = fn;
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Promise;
    } else if (!root.Promise) {
        root.Promise = Promise;
    }

})(window);

// MeadCo.ScriptX - singleton
//
(function (topLevelNs) {
    "use strict";

    if (typeof topLevelNs["ScriptX"] === "undefined") {
        console.log("intialising new ScriptX package");
        topLevelNs.ScriptX = {};
    }

    var scriptx = topLevelNs.ScriptX;

    scriptx.Connection = {
        NONE: 0,
        ADDON: 1,
        SERVICE: 2
    }

    scriptx.LibVersion = "1.3.0";
    scriptx.Connector = scriptx.CONNECTED_NONE;

    scriptx.Factory = null;
    scriptx.Printing = null;
    scriptx.Utils = null;

    console.log("Initialising MeadCo.ScriptX: " + scriptx.LibVersion);

    // Init()
    // Simple initialisation of the library
    // returns true if the MeadCo ScriptX factory object and printing object are available
    //
    // With ScriptX.Print Services this will use a synchronous (blocking, deprecated) call to the server
    //
    scriptx.Init = function () {
        if (scriptx.Printing == null) {
            console.log("scriptx.Init()");
            if (findFactory()) {
                // if we are connected to the ScriptX.Print implementation
                // then check it has connected.
                if (typeof scriptx.Printing.PolyfillInit === "function") {
                    console.log("found ScriptX.Print Services");
                    console
                        .warn("Synchronous initialisation is deprecated - please update to MeadCo.ScriptX.InitAsync().");
                    if (!scriptx.Printing.PolyfillInit()) {
                        console.log("**warning** polyfill failed.");
                        scriptx.Printing = null;
                        scriptx.Connector = scriptx.Connection.NONE;
                    } else {
                        scriptx.Connector = scriptx.Connection.SERVICE;
                    }
                } else {
                    scriptx.Connector = scriptx.Connection.ADDON;
                }
            } else {
                console.log("** Warning -- no factory **");
            }
        }

        return scriptx.Printing != null;
    }

    scriptx.InitAsync = function () {
        var prom;

        console.log("scriptx.InitAsync()");
        if (scriptx.Printing == null) {
            console.log("unknown state ...");
            prom = new Promise(function (resolve, reject) {
                console.log("looking for state ...");
                if (findFactory()) {
                    console.log("look for Polyfill ..");
                    if (typeof scriptx.Printing.PolyfillInitAsync === "function") {
                        console.log("found async ScriptX.Print Services");
                        scriptx.Printing.PolyfillInitAsync(function () {
                            scriptx.Connector = scriptx.Connection.SERVICE;
                            resolve();
                        }, reject);
                    } else {
                        scriptx.Connector = scriptx.Connection.ADDON;
                        console.log("no polyfill, using add-on");
                        resolve();
                    }
                } else {
                    console.log("** Warning -- no factory **");
                    reject();
                }
            });
        } else {
            prom = new Promise(function (resolve, reject) {
                resolve();
            });
        }

        console.log("scriptx.InitAsync() returns promise");
        return prom;
    }

    // InitWithVersion(strVersion)
    // Initialises the library and ensures that the installed version is at least strVersion where strVersion is a dotted version number (e.g. "7.1.2.65")
    // 
    scriptx.InitWithVersion = function (strVersion) {
        var bok = false;
        if (scriptx.Init()) {
            bok = scriptx.IsVersion(strVersion);
            if (!bok)
                alert("ScriptX v" + strVersion + " or later is required.\nYou are using a previous version and errors may occur.");
        }
        return bok;
    }

    // IsVersion
    // Returns true if the installed version is at least strVersion where strVersion is a dotted version number (e.g. "7.1.2.65")
    scriptx.IsVersion = function (strVersion) {
        return scriptx.IsComponentVersion("ScriptX.Factory", strVersion);
    }

    // Version
    // Returns the installed version number of ScriptX
    scriptx.Version = function () {
        return scriptx.GetComponentVersion("ScriptX.Factory");
    }

    // PrintPage
    // Print the current document, with optional prompting (no prompt in the internetzone requires a license)
    scriptx.PrintPage = function (bPrompt) {
        if (scriptx.Init())
            return scriptx.Printing.Print(bPrompt);
        return false;
    }

    // PreviewPage
    // Preview the current document
    scriptx.PreviewPage = function () {
        if (scriptx.Init()) {
            scriptx.Printing.Preview();
        }
    }

    // PreviewFrame
    // Preview the content of the *named* frame.
    scriptx.PreviewFrame = function (frame) {
        if (scriptx.Init())
            scriptx.Printing.Preview(typeof (frame) == "string" ? (scriptx.IsVersion("6.5.439.30") ? frame : eval("window." + frame)) : frame);
    }

    // PrintFrame
    // Print the content of the *named* frame with optional prompting (no prompt in the internetzone requires a license)
    scriptx.PrintFrame = function (frame, bPrompt) {
        if (scriptx.Init())
            return scriptx.Printing.Print(bPrompt, typeof (frame) == "string" ? (scriptx.IsVersion("6.5.439.30") ? frame : eval("window." + frame)) : frame);
        return false;
    }

    // BackgroundPrintURL - requires license
    // Background download and print the document from the URL. optional print prompt before queuing the print
    // and optional callback function to monitor progress.
    // [optional] fnCallback(status,statusData,data)
    // [optional] data
    // 
    var jobIndex = 1;
    scriptx.BackgroundPrintURL = function (sUrl, bPrompt, fnCallback, data) {
        if (scriptx.Init()) {
            if (typeof fnCallback == "undefined") {
                fnCallback = progressMonitor;
            }
            if (typeof data == "undefined") {
                data = "Job " + jobIndex++;
            }
            return scriptx.Printing.PrintHTMLEx(sUrl, bPrompt, fnCallback, data);
        }
        return false;
    }

    // BackgroundPrintHTML - requires license
    // Background print the html document contained in the string. The document must be complete and well formed.
    // All resource references in the HTML must be fully qualified unless a base element is included.
    scriptx.BackgroundPrintHTML = function (sHtml, fnCallback, data) {
        return scriptx.BackgroundPrintURL("html://" + sHtml, false, fnCallback, data);
    }

    // Page/Print Setup - these will work with both add-on and service
    // but return value will be wrong for service since dialogs are async
    // If the return value matters use xxxx2 api below.
    scriptx.PageSetup = function () {
        if (scriptx.Init())
            return scriptx.Printing.PageSetup();
        return false;
    }

    scriptx.PrintSetup = function () {
        if (scriptx.Init())
            return scriptx.Printing.PrintSetup();
        return false;
    }

    // Promise versions to work with async dialogs with service
    // These work with both add-on and service.
    //
    scriptx.PageSetup2 = function () {
        return new Promise(function (resolve, reject) {
            if (scriptx.Init()) {

                if (scriptx.Connector === scriptx.Connection.SERVICE) {
                    scriptx.Printing.PageSetup(function (dlgOK) {
                        if (dlgOK)
                            resolve();
                        else
                            reject();
                    });
                } else {
                    if (scriptx.Printing.PageSetup()) {
                        resolve();
                    } else {
                        reject();
                    }
                }
            }
            reject();
        });
    }

    scriptx.PrintSetup2 = function () {
        return new Promise(function (resolve, reject) {
            if (scriptx.Init()) {
                if (scriptx.Connector === scriptx.Connection.SERVICE) {
                    scriptx.Printing.PrintSetup(function (dlgOK) {
                        if (dlgOK)
                            resolve();
                        else
                            reject();
                    });
                } else {
                    if (scriptx.Printing.PrintSetup()) {
                        resolve();
                    } else {
                        reject();
                    }
                }
            }
            reject();
        });
    }


    // WaitForSpoolingComplete 
    //
    // A wrapper to hide differences between Add-on and ScriptX.Print Services 
    //
    scriptx.WaitForSpoolingComplete = function () {
        if (scriptx.Connector === scriptx.Connection.SERVICE) {
            return new Promise(function (resolve, reject) {
                scriptx.Printing.WaitForSpoolingComplete(-1, resolve);
            });
        }

        return new Promise(function (resolve, reject) {
            window.setTimeout(function () {
                scriptx.Printing.WaitForSpoolingComplete();
                resolve();
            }, 1);
        });

    }

    // HasOrientation
    // Returns true if the 'orientation' property is available, otherwise the 'portrait' property must be used.
    //
    scriptx.HasOrientation = function () {
        return scriptx.IsComponentVersion("ScriptX.Factory", "7.0.0.1");
    }

    // GetAvailablePrinters - requires license
    // returns an array of the names of the printers on the system
    //
    scriptx.GetAvailablePrinters = function () {
        var plist = new Array();
        var name;
        if (scriptx.Init()) {
            try {
                for (var i = 0; (name = scriptx.Printing.EnumPrinters(i)).length > 0 ; i++) {
                    plist.push(name);
                }
            } catch (e) { }
        }
        return plist;
    }

    // GetComponentVersion
    // returns the version number of a COM component - compatible with v7.0 and earlier implementation. (ScriptX v7.1 has an easier to use implementation)
    scriptx.GetComponentVersion = function (sComponent) {
        var a = new Object();
        var b = new Object();
        var c = new Object();
        var d = new Object();
        var s = "(Not installed)";

        try {
            scriptx.Utils.GetComponentVersion(sComponent, a, b, c, d);
            s = a[0] + "." + b[0] + "." + c[0] + "." + d[0];
        }
        catch (e) {
        }

        return s;
    }

    scriptx.ScriptXVersion = function () {
        return scriptx.GetComponentVersion("ScriptX.Factory");
    }

    scriptx.SecurityManagerVersion = function () {
        return scriptx.GetComponentVersion("MeadCo.SecMgr");
    }

    // IsComponentVersion
    // Returns true if the installed version of a COM component is at least the given version
    scriptx.IsComponentVersion = function (strComponentName, strVersionRequired) {
        return compareVersions(scriptx.GetComponentVersion(strComponentName), strVersionRequired);
    }

    // Private implementation

    // findFactory
    //
    // hook up and instance of 'factory', either the add-on or polyfill.
    function findFactory(parameters) {
        var f = window.factory || document.getElementById("factory"); // we assume the <object /> has an id of 'factory'
        if (f && f.object != null) {
            scriptx.Factory = f;
            scriptx.Utils = f.object;
            scriptx.Printing = f.printing;
            console.log("found factory");
            return true;
        }
        return false;
    }

    // compareVersions
    //
    // Return true if v1 is later than or equal to v2
    //
    function compareVersions(v1, v2) {
        var a = v1.split(".");
        var b = v2.split(".");
        var i;

        if (a.length != b.length)
            return false;

        for (i = 0; i < a.length; i++) {
            a[i] = parseInt(a[i]);
            b[i] = parseInt(b[i]);
        }

        if (a[0] > b[0])
            return true;

        if (a[0] >= b[0] && a[1] > b[1])
            return true;

        if (a[0] >= b[0] && a[1] >= b[1] && a[2] > b[2])
            return true;

        if (a[0] >= b[0] && a[1] >= b[1] && a[2] >= b[2] && a[3] >= b[3])
            return true;

        return false;
    }

    // exemplar PrintHTMLEx callback that does nothing (well, it logs to the console)

    // statusUpdate
    // Display status and/or its description
    function statusUpdate(status, txt) {
        console.log("PrintHTML Queue status: " + status + " => " + txt);
    }

    // progressMonitor
    // callback from BatchPrintPDF
    function progressMonitor(status, statusData, callbackData) {
        switch (status) {
            case 1:
                statusUpdate(status, "Request to print has been queued for: " + callbackData);
                break;

            case 2:
                statusUpdate(status, "Print job started on: " + callbackData);
                break;

            case 3:
                statusUpdate(status, "Downloading " + statusData + " for: " + callbackData);
                break;

            case 4:
                statusUpdate(status, "Download completed to " + statusData + " for: " + callbackData);
                break;

            case 5:
                statusUpdate(status, "Printing has started for: " + callbackData);
                break;

            case 6:
                statusUpdate(status, "Job complete for: " + callbackData);
                break;

            case 7:
                statusUpdate(status, "Job paused for: " + callbackData);
                break;

            case 8:
                statusUpdate(status, "PDF is being printed: " + statusData + " for: " + callbackData);
                break;

            case -1:
                statusUpdate(status, "Print failed because of an error: [" + statusData + "] for: " + callbackData);
                break;

            case -2:
                statusUpdate(status, "Printing has been abandoned for: " + callbackData);
                break;
        }
    }

}(window.MeadCo = window.MeadCo || {}));

// MeadCo.Licensing - singleton
//
(function (topLeveNs) {
    "use strict";

    topLeveNs.Licensing = {};

    var licensing = topLeveNs.Licensing;

    licensing.LibVersion = "1.3.0";
    licensing.LicMgr = null;

    licensing.Init = function () {
        if (licensing.LicMgr == null) {
            var l = window.secmgr || document.getElementById("secmgr");  // we assume the <object /> has an id of 'secmgr'
            if (l && l.object)
                licensing.LicMgr = l.object;
        }
        return licensing.LicMgr != null && typeof (licensing.LicMgr.result) != "undefined";
    }

    licensing.InitAsync = function () {

        return new Promise(function (resolve, reject) {
            if (licensing.LicMgr == null) {
                var l = window.secmgr || document.getElementById("secmgr");  // we assume the <object /> has an id of 'secmgr'
                if (l && l.object)
                    licensing.LicMgr = l.object;
            }

            if (licensing.LicMgr != null && typeof (licensing.LicMgr.result) != "undefined")
                resolve();
            else
                reject();
        });

    }


    // IsLicensed
    // Returns true if the document is licensed and advanced functionality will be available
    licensing.IsLicensed = function () {
        if (licensing.Init()) {
            var l = licensing.LicMgr.License;
            return licensing.LicMgr.result === 0 && licensing.LicMgr.validLicense;
        }

        console.log("WARNING :: MeadCo.Licensing.Init() failed so IsLicensed will return false.");
        return false;
    }

    // IsLicensedAsync
    // Returns a promise with a resolve of the loaded license detail
    //
    licensing.IsLicensedAsync = function () {
        return new Promise(function(resolve, reject) {
            if (licensing.Init()) {
                if (typeof licensing.LicMgr.GetLicenseAsync === "function") {
                    licensing.LicMgr.GetLicenseAsync(resolve, reject);
                } else {
                    resolve(licensing.LicMgr.License);
                }
            } else {
                reject();
            }
        });
    }

    // ErrorMessage
    // returns the error message that describes why licensing failed. returns emoty string if there was no error.
    var errorLicenseMsgs = new Array("Unable to locate the MeadCo License Manager object - the component may not be installed.",
			"The license for this site is not valid.",
			"The license for this site not installed on this machine.",
			"The license for this site has not been accepted by the user.",
			"There was an error loading the license. ",
            "Unable to connect to the ScriptX.Print subscription server"
			);

    licensing.ErrorMessage = function () {
        var msg = "";

        console.log("MeadCo Security Manager reports licensed: " + this.IsLicensed());
        if (!licensing.IsLicensed()) {
            var eIndex = -1;
            var msgSuffix = "";

            if (licensing.LicMgr != null) {
                console.log("license result: " + this.LicMgr.result + " valid: " + this.LicMgr.validLicense);

                switch (licensing.LicMgr.result) {
                    case 0:
                        if (!licensing.LicMgr.validLicense)
                            eIndex = 1;
                        break;

                    case 5: // scriptx.print service error
                        eIndex = 5;
                        break;

                    case 1:
                        // magic value: this only applies if path param not
                        // not given - .result==1 => license not installed
                        eIndex = 2;
                        break;

                    case -2147220500:
                        // magic value: this only applies if a path
                        // was given and the license is valid and was
                        // displayed to the user for acceptance - 
                        // .result == -2147220500 => the user clicked cancel on the dialog
                        eIndex = 3;
                        break;

                        // some other error, e.g. download failure - this will
                        // have already been displayed to the user in an error box.
                        // we could be here in the path given or not given cases if there
                        // was an error such as reading the registry, though such errors
                        // are unlikely.
                    default:
                        eIndex = 4;
                        msgSuffix = "\nLicense manager reported: (" + this.LicMgr.result + ")";
                        break;
                }

            } else {
                eIndex = 0;
            }

            if (eIndex >= 0) {
                msg = errorLicenseMsgs[eIndex] + msgSuffix;
            }
        }

        return msg;
    }

    // ReportError
    // Displays an alert box with details of any licensing error with any given message appended.
    licensing.ReportError = function (msg) {

        var errMsg = licensing.ErrorMessage();
        if (errMsg !== "") {
            reportError(errMsg, msg);
        }

    }

    function reportError(eMsg) {
        var msg = eMsg;
        for (var i = 1; i < arguments.length; i++) {
            if (arguments[i])
                msg += "\n\n" + arguments[i];
        }
        alert(msg);
    }

}(window.MeadCo = window.MeadCo || {}));


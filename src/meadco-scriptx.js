/**
 * Simple wrappers on the MeadCo ScriptX objects 'factory', 'factory.printing' and 'secmgr' with additional helper functions.
 * 
 * The implementation is for use in a browser only, not general runtime javascript environments and the code is necessarily 'old-fashioned' as it may find itself running in old versions of IE.
 *
 * ## Introduction
 * 
 * The library provides two objects within the MeadCo 'namespace':
 * 
 * | Object | Purpose | 
 * |---|---| 
 * | MeadCo.ScriptX | wraps the classic 'factory' (MeadCo.ScriptX.Utils) and factory.printing (MeadCo.ScriptX.Printing) objects and provides useful helper functions for common processes.|
 * | MeadCo.Licensing | wraps the classic 'secmgr' object. |
 *
 * ### MeadCo.ScriptX
 * 
 * The &lt;object /&gt; tag for ScriptX factory is assumed to have an id of 'factory', call MeadCo.ScriptX.Init() (or MeadCo.ScriptX.InitAsync()) to connect the wrappers to underlying implementations - returns true on success.
 *
 * 2 objects will then be available:22
 * 
 * | Object | |
 * |--- |---| 
 * | MeadCo.ScriptX.Utils |  the 'factory' object with all the properties and methods [as documented]{@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/factory} |
 * | MeadCo.ScriptX.Printing | the 'factory.printing' object with all the properties and methods [as documented]{@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing}, e.g. MeadCo.ScriptX.Printing.header = "My Report header". |
 *
 * ### MeadCo.Licensing
 * 
 * The &lt;object /&gt; tag for MeadCo Security Manager is assumed to have an id of 'secmgr', call MeadCo.Licensing.IsLicensed() to test if the licensed is valid for the document and has been installed/accepted.
 * 
 * ## Use with ScriptX.Services
 * 
 * MeadCoScriptXJS supports working with ScriptX.Services or ScriptX.Add-on and so this librray provides an abstraction and helper functions for working seamlessly with either ScriptX.Addon or ScriptX.Services. This works by
 * utilising the [MeadCo ScriptX.Services Client Library]{@link https://meadco.github.io/ScriptX.Print.Client/} emulation of 'factory' and 'secmgr'. When both libraries are present, on IE 11 with ScriptX.Addon available it will 
 * take priority. On any other browser ScriptX.Services will be used.
 * 
 * Async scenarios with ScriptX.Print Services are supported by providing async wrappers on ScriptX.Addon functions with promises. A promise polyfill is required if promise is
 * not implemented in the browser we recommend (and test with) https://github.com/taylorhakes/promise-polyfill.
 * 
 * @example <caption>Example of initialisation and use of wrappers</caption>
 *  $(window).on('load', function () {
 *    if ( MeadCo.ScriptX.Init() (
 *    {
 *       $("#info").text("ScriptX version: " + MeadCo.ScriptX.GetComponentVersion("scriptx.factory"));
 *       MeadCo.ScriptX.Printing.header =
 *        "MeadCo's ScriptX&b:&p of &P:&bBasic Printing Sample";
 *      MeadCo.ScriptX.Printing.footer =
 *        "The de facto standard for advanced web-based printing";
 *      MeadCo.ScriptX.Printing.orientation = "landscape";
 *      $("#btnprint").click(function() {
 *          MeadCo.ScriptX.PrintPage(false);
 *   }
 * });
 * 
 * @example <caption>Example of MeadCo.Licensing.IsLicensed()</caption>
 * if ( MeadCo.Licensing.IsLicensed() ) {
 *  	...
 * }
 * else {
 *    MeadCo.Licensing.ReportError();
 * }
 *
 * @namespace MeadCoScriptX
 */

// v1.4.0 and later require a promise polyfill if not implemented in the browser
//  we recommend (and test with) https://github.com/taylorhakes/promise-polyfill
//
// v1.3.0 and later introduce an async model to enable async scenarios with ScriptX.Print Services.
//
// v1.2.0 and later include support for working with ScriptX Services via a polyfill
//  - include meadco-scriptxfactory.js before this file and call MeadCo.ScriptX.Print.HTML.connect() 
//  see https://meadco.github.io/ScriptX.Print.Client/
//
//

// MeadCo.ScriptX - static singleton instances.
//
(function (topLevelNs) {
    "use strict";

    if (typeof topLevelNs["ScriptX"] === "undefined") {
        console.log("intialising new ScriptX package");
        topLevelNs.ScriptX = {};
    }

    const version = "1.10.8";
    let scriptx = topLevelNs.ScriptX;

    /**
     * Enum to describe the implementation being wrapped : .Addon or .Services
     * 
     * @typedef {number} Connection
     * @enum {Connection}
     * @memberof MeadCoScriptX
     * @readonly
     * @property {number} NONE 0 no connection wrapped (initialise not called or failed)
     * @property {number} ADDON 1 ScriptX.Addon is being wrapped
     * @property {number} SERVICE 2 ScriptX.Services is being wrapped
     */
    const enumConnection = {
        NONE: 0,
        ADDON: 1,
        SERVICE: 2
    };

    /**
     * Enum to describe the units used on measurements. These values do match the values used by the MeadCo ScriptX COM Servers. 
     *
     * @typedef {number} MeasurementUnits
     * @enum {MeasurementUnits}
     * @memberof MeadCoScriptX
     * @readonly
     * @property {number} DEFAULT 0 use the default at the print server
     * @property {number} MM 1 millimeters  
     * @property {number} INCHES 2 inches
     */
    const enumMeasurementUnits = {
        DEFAULT: 0,
        MM: 1,
        INCHES: 2
    };

    /**
     * @typedef Margins
     * @memberof MeadCoScriptX
     * @property {number} left
     * @property {number} right
     * @property {number} top
     * @property {number} bottom
     *
     */

    /**
     * Describe pagesetup - orientation and the margins to use
     * 
     * @typedef {Object} PageSetup
     * @memberof MeadCoScriptX
     * @property {MeasurementUnits} units The units used for margins
     * @property {string} orientation valid values are 'landscape' and 'portrait'
     * @property {Margins} margins the margins to use
     */


    /**
     * @typedef {Object} PrintSettings
     * @memberof MeadCoScriptX
     * @property {string} header
     * @property {string} footer 
     * @property {PageSetup} pageSetup
     */

    /**
     * @typedef {Object} ServiceConnection
     * @memberof MeadCoScriptX
     * @property {string} serverUrl
     * @property {string} licenseGuid
     * @property {number} licenseRevision
     * @property {string} licensePath
     * 
     */

    /**
     * @typedef {Object} StartupSettings
     * @memberof MeadCoScriptX
     * @property {ServiceConnection} serviceConnection;
     * @property {PrintSettings} printSettings
     */

    console.log("Initialising MeadCo.ScriptX: " + version);

    // expose enumerations
    scriptx.MeasurementUnits = enumMeasurementUnits;
    scriptx.Connection = enumConnection;
    scriptx.Factory = null;
    scriptx.Printing = null;
    scriptx.Utils = null;

    // for documentation

    /**
     * The discovered connection - NONE, ADDON or SERVICE
     * @memberof MeadCoScriptX
     * @readonly 
     */
    let Connector = enumConnection.NONE;

    /**
     * The semver version of this library
    * @memberof MeadCoScriptX
    * @readonly
    */
    const LibVersion = version;

    // exposed values.
    scriptx.Connector = enumConnection.NONE;
    scriptx.LibVersion = version;

    /**
     * Perform full asynchronous initialisation - for services, connecting to a server, then for addon and services connecting to a secmgr implementation, checking for a 
     * license and connecting to factory and printing implementations. 
     * 
     * Lastly apply print settings as defined.
     * 
     * This is the preferred library initialisation call especially when wishing to support working with ScriptX.Services as it a) ensures a license is available
     * before attempting services calls and b) is asynchronous and c) hides a lot of code in a simple call.
     * 
     * @function StartAsync
     * @memberof MeadCoScriptX
     * @param {StartupSettings} settings
     * @returns {Promise} Promise object presents .connection (implementation type) and .license (detail) to resolve and error message to reject
     * @example
     *  $(window).on('load', function () {
     *    MeadCo.ScriptX.StartAsync({
     *          serviceConnection: {
     *              serverUrl: "http://127.0.0.1:41191",
     *              licenseGuid: "{370000ED-D40C-43D4-B3D3-F2E7D2EFF47D}", // invalid example, use same as for addon
     *              licenseRevision: 0,
     *              licensePath: "warehouse"
     *          },
     *          printSettings: {
     *              header: "Page &p of &P",
     *              footer: "&D",
     *              pageSetup: {
     *                  orientation: "landscape"
     *              }              
     *          }
     *      })
     *      .then(function() {
     *          $("#btn-print").click(function() {
     *              MeadCo.ScriptX.PrintPage(false);
     *          });
     *      })
     *      .catch(function(e) {
     *          alert("An error occurred, printing will not be available.\n\n"+e);
     *      });
     */
    scriptx.StartAsync = function (settings) {
        return new Promise(function (resolve, reject) {
            ifServiceSettingsThenConnect(settings)
                .then(function () {
                    MeadCo.Licensing.IsLicensedAsync()
                        .then(function (license) {
                            MeadCo.ScriptX.InitAsync()
                                .then(function (connection) {
                                    // good to go, apply any given settings ...
                                    try {
                                        if (settings && settings.printSettings) {
                                            applySettings(settings.printSettings);
                                        }
                                        resolve({
                                            license: license,
                                            connection: connection
                                        });
                                    }
                                    catch (e) {
                                        console.error("Exception while applying settings: " + e.message);
                                        if (reject) {
                                            reject(e.message)
                                        }
                                    }
                                })
                                .catch(function (errorMessage) {
                                    if (reject) {
                                        reject(errorMesssage);
                                    }
                                });
                        })
                        .catch(function (errorMessage) {
                            if (reject) {
                                reject(errorMessage);
                            }
                        });
                })
                .catch(function (errorMessage) {
                    if (reject) {
                        reject(errorMessage);
                    }
                });
        });
    }

    /**
    * Performs synchronous initialisation by discovering and connecting to either ScriptX.Addon or
    * the MeadCo ScriptX.Services Client Library emulation of the 'factory' object.
    * 
    * With ScriptX.Print Services this will use a synchronous (blocking, deprecated) call to the server.
    * 
    * From v1.9.0 this function also initialises licensing when ScriptX.Services is being used by the browser
    * to reduce required coding updates where MeadCo.ScriptX.Init() has been used.
    * 
    * @see {@link https://meadco.github.io/ScriptX.Print.Client/ | MeadCo ScriptX.Services Client Library}
    * 
    * @function Init
    * @memberof MeadCoScriptX
    * @returns {boolean} true if initialisation succeeded and implementations of the MeadCo ScriptX factory and printing objects are available, false if failed
    */
    scriptx.Init = function () {
        if (scriptx.Printing === null) {
            console.log("scriptx.Init()");
            if (findFactory(true) !== null) {
                // if we are connected to the ScriptX.Print implementation
                // then check it has connected.
                if (typeof scriptx.Printing.PolyfillInit === "function") {
                    console.log("found ScriptX.Print Services");
                    console
                        .warn("Synchronous initialisation is deprecated - please update to MeadCo.ScriptX.InitAsync().");

                    // All ScriptX.Services require the license is already available which my require (4WPC) 
                    // a post to the server before intialisation can be completed. This is not a code organisation
                    // that was required by .Addon and so was not coded that way -- we'll force the license
                    // initialisatinon here. Any code following this call that tests/initialises licencing will
                    // already be primed.
                    if (!MeadCo.Licensing.IsLicensed() || !scriptx.Printing.PolyfillInit()) {
                        console.warn("scriptx.Init() licensing or polyfillinit failed.");
                        scriptx.Printing = null;
                        scriptx.Connector = scriptx.Connection.NONE;
                    } else {
                        scriptx.Connector = scriptx.Connection.SERVICE;
                    }
                } else {
                    scriptx.Connector = scriptx.Connection.ADDON;
                }
            } else {
                console.warn("** Warning -- no factory **");
            }
        }

        return scriptx.Printing !== null;
    };

    /**
    * Performs asynchronous initialisation by discovering and connecting to either ScriptX.Addon or
    * ScriptX.Services.
    * 
    * From v1.9.0 this function also initialises licensing when ScriptX.Services is being used by the browser
    * to reduce required coding updates where MeadCo.ScriptX.Init() has been used. 
    * To obtain the license read the property MeadCo.Licensing.LicMgr.License
    *
    *
    * @function InitAsync
    * @memberof MeadCoScriptX
    * @returns {Promise} Promise object represents enum Connection with value of the connection found (NONE, ADDON or SERVICES)
    */
    scriptx.InitAsync = function () {
        let prom;

        console.log("scriptx.InitAsync()");
        if (scriptx.Printing === null) {
            console.log("unknown state ...");
            prom = new Promise(function (resolve, reject) {
                console.log("looking for state ...");
                if (findFactory(true) !== null) {
                    console.log("look for Polyfill ..");
                    if (typeof scriptx.Printing.PolyfillInitAsync === "function") {
                        console.log("found async ScriptX.Print Services");
                        // All ScriptX.Services require the license is already available which my require (4WPC) 
                        // a post to the server before intialisation can be completed. This is not a code organisation
                        // that was required by .Addon and so was not coded that way -- we'll force the license
                        // initialisatinon here. Any code following this call that tests/initialises licencing will
                        // already be primed.
                        MeadCo.Licensing.IsLicensedAsync().then(function () {
                            console.log("license is available");
                            scriptx.Printing.PolyfillInitAsync(function () {
                                scriptx.Connector = scriptx.Connection.SERVICE;
                                console.log("scriptx.InitAsync() calling resolve ...");
                                resolve(scriptx.Connector);
                            }, reject);
                        })
                            .catch(function (e) {
                                reject(e);
                            });
                    } else {
                        scriptx.Connector = scriptx.Connection.ADDON;
                        console.log("no polyfill, using add-on");
                        resolve(scriptx.Connector);
                    }
                } else {
                    console.warn("** Warning -- no factory **");
                    if (reject) {
                        reject("Unable to find a ScriptX 'factory' object.");
                    }
                }
            });
        } else {
            // already initialised
            prom = new Promise(function (resolve, reject) {
                resolve(scriptx.Connector);
            });
        }

        return prom;
    };

    /**
    *  Initialises the library and ensures that the installed version is at least some version. If ScriptX is available but not the required version an alert dialog is displayed.
    *  
    * @function InitWithVersion
    * @memberof MeadCoScriptX
    * @param {string} strVersion minimum required version number (e.g. "7.1.2.65")
    * @returns {boolean} true if initialisation succeeded and implementations of the MeadCo ScriptX factory and printing objects are available at the required version of higher, false if failed
    * @deprecated from version 1.8.0
    */
    scriptx.InitWithVersion = function (strVersion) {
        let bok = false;
        if (scriptx.Init()) {
            bok = scriptx.IsVersion(strVersion);
            if (!bok)
                alert("ScriptX v" + strVersion + " or later is required.\nYou are using a previous version and errors may occur.");
        }
        return bok;
    };

    /**
    * @function Version
    * @memberof MeadCoScriptX
    * 
    * @returns {string} the installed version number of ScriptX (if services is in use then returns the version of ScriptX.Addon being emulated).
    *
    * */
    scriptx.Version = function () {
        return scriptx.GetComponentVersion("ScriptX.Factory");
    };

    /**
    * @function IsVersion
    * @memberof MeadCoScriptX
    * @param {string} strVersion
    * @returns {boolean} true if the installed version is at least strVersion where strVersion is a dotted version number (e.g. "7.1.2.65")
    */
    scriptx.IsVersion = function (strVersion) {
        return scriptx.IsComponentVersion("ScriptX.Factory", strVersion);
    };

    /**
     * @function IsServices
     * @memberof MeadCoScriptX
     * @param {string} strVersion
     * @returns {boolean} true if ScriptX.Services is/will be used
     *
     */
    scriptx.IsServices = function () {
        let connection = scriptx.Connector;
        // If init() not yet called, try a guess. 
        //
        // This relies on the Add-on and the .services client scripts are all included before this script.
        // But, we do not want to perform a full init here because connection data might not have been specified
        console.log("IsServices() on connector: " + connection);
        if (connection === enumConnection.NONE) {
            let p = findFactory(false);
            if (p !== null) {
                connection = typeof p.PolyfillInit === "function" ? enumConnection.SERVICE : enumConnection.ADDON;
            }
            else {
                // assume service will be used, for sure the Add.on isnt here
                connection = enumConnection.SERVICE;
            }
        }

        return connection === enumConnection.SERVICE;
    };

    /**
     * If services is in use, returns the version of the services server. If addon is in use returns ""
     * 
     * Requires services 2.9 or later, earlier versions will return the client library version (1.x)
     * 
     * @function ServicesVersion
     * @memberof MeadCoScriptX
     * @returns {string}
     * */
    scriptx.ServicesVersion = function () {
        if (scriptx.IsServices()) {
            return scriptx.GetComponentVersion("scriptx.services");
        }

        return "";
    };

    /**
     * @function IsServicesVersion
     * @memberof MeadCoScriptX
     * @param {string} strVersion
     * @returns {boolean} true if the services server in use is at least strVersion where strVersion is a dotted version number (e.g. "7.1.2.65")
     */
    scriptx.IsServicesVersion = function (strVersion) {
        if (scriptx.IsServices()) {
            return scriptx.IsComponentVersion("scriptx.services", strVersion);
        }

        return false;
    };

    /**
     * With ScriptX.Addon, printHtml(Ex) and printPdf(Ex) inherit authorisation cookies from the hosting browser. This does not happen with 
     * ScriptX.Services and in modern uses the authorisation cookie is hidden from javascript so cannot be automated. The cookie must be exposed 
     * in the HTML and passed in with a call to this function.
     * 
     * @function ApplyContentAuthorisationCookie
     * @memberof MeadCoScriptX
     * @param {string} strCookie The cookie in form name=value. use "" to remove use of  cookie authorisation
     */
    scriptx.SetContentAuthorisationCookie = function (strCookie) {
        if (scriptx.IsServices()) {
            scriptx.Printing.PolyfillAuthorisationCookie = strCookie;
        }
    };

    /**
    * Print the current document, with optional prompting (no prompt in the internetzone requires a license). This is a wrapper on the Print API.
    * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing/Print | Print API}
    * @function PrintPage
    * @memberof MeadCoScriptX
    * @param {boolean} [bPrompt=true] bPrompt True if a dialog is to prompt the user to confirm the print
    * @returns {boolean} true if print was started, otherwise false
    * @deprecated from 1.4 as the return value will be wrong for service since dialogs are async. Use PrintPage2 if the return value matters
    */
    scriptx.PrintPage = function (bPrompt) {
        if (scriptx.Init())
            return scriptx.Printing.Print(bPrompt);
        return false;
    };

    /**
    * Print the current document, with optional prompting (no prompt in the internetzone requires a license). This is a wrapper on the Print API.
    * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing/Print | Print API}
    * @function PrintPage2
    * @memberof MeadCoScriptX
    * @param {boolean} [bPrompt=true] bPrompt
    * @returns {Promise} Promise object represents boolean with value true if the print was started
    */
    scriptx.PrintPage2 = function (bPrompt) {
        return new Promise(function (resolve, reject) {
            if (scriptx.Init()) {
                if (scriptx.Connector === scriptx.Connection.SERVICE) {
                    scriptx.Printing.Print(bPrompt, null, function (dlgOk) {
                        resolve(dlgOk);
                    });

                } else {
                    resolve(scriptx.Printing.Print(bPrompt));
                }
            }
            else
                reject();
        });
    };

    /**
     * Opens a preview of the printed current document (page). This is a wrapper on the Preview() API.
     * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing/Preview | Preview() API}
     * @function PreviewPage
     * @memberof MeadCoScriptX
     * */
    scriptx.PreviewPage = function () {
        if (scriptx.Init()) {
            scriptx.Printing.Preview();
        }
    };

    // PrintFrame
    // Print the content of the *named* frame with optional prompting (no prompt in the internetzone requires a license)

    /**
    * Print the content of the frame, with optional prompting (no prompt in the internetzone requires a license). This is a wrapper on the Print API.
    * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing/Print | Print API}
    * @function PrintFrame
    * @memberof MeadCoScriptX
    * @param {string|object} frame The frame object or the name of the frame to be printed.
    * @param {boolean} [bPrompt=true] bPrompt True if a dialog is to prompt the user to confirm the print
    * @returns {boolean} true if print was started, otherwise false
    * @deprecated from 1.4 as the return value will be wrong for service when using prompted printing since dialogs are async. Use PrintFrame2 if the return value matters
     */
    scriptx.PrintFrame = function (frame, bPrompt) {
        if (scriptx.Init())
            return scriptx.Printing.Print(bPrompt, typeof (frame) === "string" ? (scriptx.IsVersion("6.5.439.30") ? frame : eval("window." + frame)) : frame);
        return false;
    };

    /**
    * Print the content of the frame, with optional prompting (no prompt in the internetzone requires a license). This is a wrapper on the Print API.
    * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing/Print | Print API}
    * @function PrintFrame2
    * @memberof MeadCoScriptX
    * @param {string|object} frame The frame object or the name of the frame to be printed.
    * @param {boolean} [bPrompt=true] bPrompt True if a dialog is to prompt the user to confirm the print
    * @returns {Promise} Promise object represents boolean with value true if the print was started
    */
    scriptx.PrintFrame2 = function (frame, bPrompt) {
        return new Promise(function (resolve, reject) {
            if (scriptx.Init()) {
                if (scriptx.Connector === scriptx.Connection.SERVICE) {
                    scriptx.Printing.Print(bPrompt, frame, function (dlgOk) {
                        resolve(dlgOk);
                    });

                } else {
                    resolve(scriptx.PrintFrame(frame, bPrompt));
                }
            }
            else
                reject();
        });
    };

    /**
     * Opens a preview of the printed frame. This is a wrapper on the Preview() API.
     * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing/Preview | Preview() API}
     * @function PreviewPage
     * @memberof MeadCoScriptX
     * @param {string|object} frame The frame object or the name of the frame to be printed.
     */
    scriptx.PreviewFrame = function (frame) {
        if (scriptx.Init())
            scriptx.Printing.Preview(typeof (frame) === "string" ? (scriptx.IsVersion("6.5.439.30") ? frame : eval("window." + frame)) : frame);
    };


    // BackgroundPrintURL - requires license
    // Background download and print the document from the URL. optional print prompt before queuing the print
    // and optional callback function to monitor progress.
    // [optional] fnCallback(status,statusData,data)
    // [optional] data
    // 
    // If no callback data provided, use "Job " + jobIndex - incrementing on each job
    let jobIndex = 1;

    /**
     * Download and print an HTML document in the background. This is a wrapper on the PrintHtmlEX() API.
     * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing/PrintHTMLEx | PrintHtmlEX() API}.
     * @function BackgroundPrintURL
     * @memberof MeadCoScriptX
     * @param {string} sUrl The url of the (html) document to download and print
     * @param {boolean} [bPrompt=true] bPrompt True if a dialog is to prompt the user to confirm the print
     * @param {callback} [fnCallback=log to console] Callback function called on progress events fnCallback(nStatus, strStatusData, callbackData)
     * @param {object} [data="Job" + incrementing index] Data to pass to the event callback function
     * @returns {boolean} for prompted printing returns true if the user started the print and it was queued, otherwise false. Always returns true for promptless printing   
     * @deprecated from 1.4 as the return value will be wrong for service when using prompted printing since dialogs are async. Use BackgroundPrintURL2 if the return value matters
     */
    scriptx.BackgroundPrintURL = function (sUrl, bPrompt, fnCallback, data) {
        if (scriptx.Init()) {
            if (typeof fnCallback === "undefined") {
                fnCallback = progressMonitor;
            }
            if (typeof data === "undefined") {
                data = "Job " + jobIndex++;
            }
            return scriptx.Printing.PrintHTMLEx(sUrl, bPrompt, fnCallback, data);
        }
        return false;
    };

    /**
     * Download and print an HTML document in the background. This is a wrapper on the PrintHtmlEX() API.
     * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing/PrintHTMLEx | PrintHtmlEX() API}.
     * @function BackgroundPrintURL2
     * @memberof MeadCoScriptX
     * @param {string} sUrl The url of the (html) document to download and print
     * @param {boolean} [bPrompt=true] bPrompt True if a dialog is to prompt the user to confirm the print
     * @param {callback} [fnCallback=log to console] Callback function called on progress events fnCallback(nStatus, strStatusData, callbackData)
     * @param {object} [data="Job" + incrementing index] Data to pass to the event callback function
     * @returns {Promise} Promise object represents boolean with value true for prompted printing and the user started the print and it was queued. For promptless printing always represents true.
     */
    scriptx.BackgroundPrintURL2 = function (sUrl, bPrompt, fnCallback, data) {
        return new Promise(function (resolve, reject) {
            if (scriptx.Init()) {

                if (typeof fnCallback === "undefined") {
                    fnCallback = progressMonitor;
                }
                if (typeof data === "undefined") {
                    data = "Job " + jobIndex++;
                }

                if (scriptx.Connector === scriptx.Connection.SERVICE) {
                    scriptx.Printing.PrintHTMLEx(sUrl, bPrompt, fnCallback, data, function (dlgOk) {
                        resolve(dlgOk);
                    });
                } else {
                    resolve(scriptx.Printing.PrintHTMLEx(sUrl, bPrompt, fnCallback, data));
                }
            }
            else {
                if (reject) {
                    reject();
                }
            }
        });
    };

    /**
      * Background print the html document contained in the string. This is a wrapper on the PrintHtmlEX() API using html:// protocol. 
      * 
      * Note that processing after call is asynchronous. There is no Promise returning version as the function always returns true (there is no prompting).
      * See MeadCo.ScriptX.WaitForSpoolingComplete() for how to implement synchronous coding.
      * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing/PrintHTMLEx | PrintHtmlEX() API}.
      * @function BackgroundPrintHTML
      * @memberof MeadCoScriptX
      * @param {string} sHtml The html to print. The document must be complete and well formed.All resource references in the HTML must be fully qualified unless a base element is included.
      * @param {callback} [fnCallback=log to console] Callback function called on progress events fnCallback(nStatus, strStatusData, callbackData)
      * @param {object} [data="Job" + incrementing index] Data to pass to the event callback function
      * @returns {boolean} always returns true
      */
    scriptx.BackgroundPrintHTML = function (sHtml, fnCallback, data) {
        return scriptx.BackgroundPrintURL("html://" + sHtml, false, fnCallback, data);
    };

    // Direct/RAW printing - requires a license 

    /**
     * Directly print a stream of characters to a printer without formatting, pagination or any other processing. This is a wrapper on the printString() API
     * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/rawPrinting/printString | printString() API}
     * @function DirectPrintString
     * @memberof MeadCoScriptX
     * @param {string} sPrinterName The name of the printer to print to.
     * @param {string} sData The string (e.g. ZPL) to send directly to the printer as a byte stream
     */
    scriptx.DirectPrintString = function (sPrinterName, sData) {

        if (scriptx.Init()) {
            let rawPrinter = scriptx.Factory.rawPrinting;

            rawPrinter.printer = sPrinterName;
            rawPrinter.printString(sData);
        }
    };

    /**
     * Download content from a url and send its contents (e.g. ZPL) directly to the printer as a byte stream. This is a wrapper on the printDocument() API
     * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/rawPrinting/printDocument | printDocument() API}
     * @function DirectPrintDocument
     * @memberof MeadCoScriptX
     * @param {string} sPrinterName The name of the printer to print to.
     * @param {string} sUrl url of the file whose contents are to be sent to the printer. The url must be a fully qualified url.
     */
    scriptx.DirectPrintDocument = function (sPrinterName, sUrl) {

        if (scriptx.Init()) {
            var rawPrinter = scriptx.Factory.rawPrinting;

            rawPrinter.printer = sPrinterName;
            rawPrinter.printDocument(scriptx.Factory.baseURL(sUrl));
        }
    };

    // Page/Print Setup - these will work with both add-on and service
    // but return value will be wrong for service since dialogs are async
    // If the return value matters use xxxx2 api below.

    /**
     * Invokes a Page Setup Dialog. This is a wrapper on the PageSetup API
     * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing/PageSetup | PageSetup API}
     * @see PageSetup2
     * @function PageSetup
     * @memberof MeadCoScriptX
     * @returns {boolean} true if the user closed the dialog with the OK button, otherwise false.
     * @deprecated from 1.4 as the return value will be wrong for service since dialogs are async. Use PageSetup2 if the return value matters
     */
    scriptx.PageSetup = function () {
        if (scriptx.Init())
            return scriptx.Printing.PageSetup();
        return false;
    };

    /**
    * Invokes a Print Setup Dialog. This is a wrapper on the PrintSetup API
    * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing/PrintSetup | PrintSetup API}
    * @see {@link MeadCoScriptX."PrintSetup2" | PrintSetup2 }
    * @function PrintSetup
    * @memberof MeadCoScriptX
    * @returns {boolean} true if the user closed the dialog with the OK button, otherwise false.
    * @deprecated from 1.4 as the return value will be wrong for service since dialogs are async. Use PrintSetup2 if the return value matters
    */
    scriptx.PrintSetup = function () {
        if (scriptx.Init())
            return scriptx.Printing.PrintSetup();
        return false;
    };

    // Promise versions to work with async dialogs with service
    // These work with both add-on and service.
    //

    /**
     * Invokes a Page Setup Dialog. This is a wrapper on the PageSetup API
     * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing/PageSetup | PageSetup API}
     * @function PageSetup2
     * @memberof MeadCoScriptX
     * @returns {Promise} Promise object represents boolean with value true if the user closed the dialog with the OK button, otherwise false.
     */
    scriptx.PageSetup2 = function () {
        return new Promise(function (resolve, reject) {
            if (scriptx.Init()) {

                if (scriptx.Connector === scriptx.Connection.SERVICE) {
                    scriptx.Printing.PageSetup(function (dlgOK) {
                        if (dlgOK)
                            resolve();
                        else {
                            if (reject) {
                                reject();
                            }
                        }
                    });
                } else {
                    if (scriptx.Printing.PageSetup()) {
                        resolve();
                    } else {
                        if (reject) {
                            reject();
                        }
                    }
                }
            }
            else
                reject();
        });
    };

    /**
    * Invokes a Print Setup Dialog. This is a wrapper on the PrintSetup API
    * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing/PrintSetup | PrintSetup API}
    * @function PrintSetup2
    * @memberof MeadCoScriptX
    * @returns {Promise} Promise object represents boolean with value true if the user closed the dialog with the OK button, otherwise false.
    */
    scriptx.PrintSetup2 = function () {
        return new Promise(function (resolve, reject) {
            if (scriptx.Init()) {
                if (scriptx.Connector === scriptx.Connection.SERVICE) {
                    scriptx.Printing.PrintSetup(function (dlgOK) {
                        if (dlgOK)
                            resolve();
                        else {
                            if (reject) {
                                reject();
                            }
                        }
                    });
                } else {
                    if (scriptx.Printing.PrintSetup()) {
                        resolve();
                    } else {
                        if (reject) {
                            reject();
                        }
                    }
                }
            }
            else {
                if (reject) {
                    reject();
                }
            }
        });
    };


    // WaitForSpoolingComplete 
    //
    // A wrapper to hide differences between Add-on and ScriptX.Print Services 
    //

    /**
     * Waits for all pending spooling and download operations originated with Print, PrintHTML and BatchPrintPDF to complete. This is useful
     * for providing 'busy' UI or waiting for all jobs to complete before closing a window. 
     * 
     * This is a wrapper on the common use (no arguments) of the WaitForSpoolingComplete API and returns a Promise so that it can work with
     * both ScriptX.Addon and ScriptX.Services
     * 
     * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing/WaitForSpoolingComplete | WaitForSpoolingComplete API }
     * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/HowToGuides/ScriptXServices/ThenToNow/Stage7 | Working with ScriptX.Addon and ScriptX.Services }
     * @see {@link https://meadco.github.io/ScriptX.Print.Client/index.html | ScriptX.Services Client Library }
     * @function WaitForSpoolingComplete
     * @memberof MeadCoScriptX
     * @returns {Promise} Promise object represents boolean with value true if all jobs have been completed (will always be true).
     * @example 
     * MeadCo.ScriptX.PrintPage(false);
     * MeadCo.ScriptX.WaitForSpoolingComplete().finally(function(bAllJobsComplete) {
     *  self.close();
     * })
     */
    scriptx.WaitForSpoolingComplete = function () {
        if (scriptx.Connector === scriptx.Connection.SERVICE) {
            return new Promise(function (resolve, reject) {
                scriptx.Printing.WaitForSpoolingComplete(-1, resolve);
            });
        }

        return new Promise(function (resolve, reject) {
            window.setTimeout(function () {
                resolve(scriptx.Printing.WaitForSpoolingComplete());
            }, 1);
        });

    };

    /**
     * Ensures orderly closing of a window in ScriptX.Services by waiting for jobs to complete before the window closes. This is done automatically by ScriptX.Addon
     * @function CloseWindow
     * @memberof MeadCoScriptX
     * @param {object} oWindow The window to close
     */
    scriptx.CloseWindow = function (oWindow) {

        if (scriptx.IsServices()) {
            scriptx.Printing.WaitForSpoolingComplete(5000, function () {
                oWindow.close();
            });
        }
        else {
            oWindow.close();
        }
    }

    /**
     * @function HasOrientation
     * @memberof MeadCoScriptX
     * @returns {boolean} true if the 'orientation' property is available, otherwise the 'portrait' property must be used.
     * */
    scriptx.HasOrientation = function () {
        return scriptx.IsComponentVersion("ScriptX.Factory", "7.0.0.1");
    };

    // GetAvailablePrinters - requires license
    // returns an array of the names of the printers on the system
    //

    /** 
     * Determnines the names of the printers available pon the device. This function wraps the EnumPrinters API in a more convenient form.
     * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing/EnumPrinters | EnumPrinters API}
     * @function GetAvailablePrinters
     * @memberof MeadCoScriptX
     * @returns {string[]} array of the names of the available printers available.
     * */
    scriptx.GetAvailablePrinters = function () {
        let plist = new Array();
        let name;
        if (scriptx.Init()) {
            try {
                for (var i = 0; (name = scriptx.Printing.EnumPrinters(i)).length > 0; i++) {
                    plist.push(name);
                }
            } catch (e) {
                var x = 1;
            }
        }
        return plist;
    };

    // GetComponentVersion
    // returns the version number of a COM component - compatible with v7.0 and earlier implementation. (ScriptX v7.1 has an easier to use implementation)


    /**
     * Returns the version of an installed component as a dotted version string. This wraps the deprecated API GetComponentVersion which is available
     * with all versions of ScriptX. Use the recommended alternatives.
     * 
     * @function GetComponentVersion
     * @memberof MeadCoScriptX
     * @param {string} sComponent The component name, e.g. "ScriptX.Factory"
     * @returns {string} Installed version of the component or "Not installed"
     * @deprecated since v7 of ScriptX.Addon. Use ScriptX.Utils.ComponentVersionString or ScriptX.Utils.ScriptXVersion or ScriptX.Utils.SecurityManagerVersion
     * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/factory/ComponentVersionString | ComponentVersionString API}
     * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/factory/ScriptXVersion | ScriptXVersion API}
     * @see {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/factory/SecurityManagerVersion | SecurityManagerVersion API}
     */
    scriptx.GetComponentVersion = function (sComponent) {
        let a = new Object();
        let b = new Object();
        let c = new Object();
        let d = new Object();
        let s = "(Not installed)";

        try {
            scriptx.Utils.GetComponentVersion(sComponent, a, b, c, d);
            s = a[0] + "." + b[0] + "." + c[0] + "." + d[0];
        }
        catch (e) {
            var x = 1;
        }

        return s;
    };

    /**
     * Get the installed version of ScriptX
     * @function ScriptXVersion
     * @memberof MeadCoScriptX
     * @returns {string} Installed version or "Not installed"
     */
    scriptx.ScriptXVersion = function () {
        return scriptx.GetComponentVersion("ScriptX.Factory");
    };

    /**
     * Get the installed version of MeadCo Security Manager
     * @function SecurityManagerVersion
     * @memberof MeadCoScriptX
     * @returns {string} Installed version or "Not installed"
     */
    scriptx.SecurityManagerVersion = function () {
        return scriptx.GetComponentVersion("MeadCo.SecMgr");
    };

    /**
     * Determine if the installed version of a COM component is at least the given version
     * 
     * @function IsComponentVersion
     * @memberof MeadCoScriptX
     * @param {string} strComponentName The name of the COM Component 
     * @param {string} strVersionRequired minimum version in dotted form
     * @returns {boolean} true is the component is installed and at least the version required.
     */
    scriptx.IsComponentVersion = function (strComponentName, strVersionRequired) {
        return compareVersions(scriptx.GetComponentVersion(strComponentName), strVersionRequired);
    };

    // Private implementation

    // findFactory
    //
    // find an instance of 'factory', either the add-on or polyfill, optionally hook up to
    // the module and return the instance of the printing object (in Add-on this creates the object)
    function findFactory(bRecord) {
        let f = window.factory || document.getElementById("factory"); // we assume the <object /> has an id of 'factory'
        if (f && typeof f.object !== "undefined" && f.object !== null) {
            if (bRecord) {
                scriptx.Factory = f;
                scriptx.Utils = f.object;
                scriptx.Printing = f.printing;
            }
            console.log("found a scriptx factory");
            return f.printing;
        }
        return null;
    }

    // compareVersions
    //
    // Return true if v1 is later than or equal to v2
    //
    function compareVersions(v1, v2) {
        let a = v1.split(".");
        let b = v2.split(".");
        let i;

        if (a.length !== b.length)
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
    // callback from PrintHTMLEx / BatchPrintPDFEx
    function progressMonitor(status, statusData, callbackData) {
        switch (status) {
            case 1:
                // v8.2 / 10.2 will passback the queue mode 
                statusUpdate(status, "Request to print has been queued for: " + callbackData + (typeof statusData === "undefined" ? "" : ", " + statusData));
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

    // if the settings describe a service connection then start it up. Otherwise, assume service has been connected by
    // another means (i.e. tag attributes or API) or .Addon is being used.
    //
    // Returns a Promise of resolved or rejected with an error message
    //
    // @param { StartupSettings } settings
    // @returns { Promise } Promise object represents null on success and error message on error.
    //
    function ifServiceSettingsThenConnect(settings) {

        return new Promise(function (resolve, reject) {
            if (settings && settings.serviceConnection) {
                let sc = settings.serviceConnection;

                // connect up licensing so can query license.
                MeadCo.ScriptX.Print.Licensing.connect(sc.serverUrl, sc.licenseGuid);

                if4WPCLicenseApply(sc)
                    .then(function () {
                        MeadCo.ScriptX.Print.HTML.connectAsync(
                            sc.serverUrl,
                            sc.licenseGuid,
                            function () {
                                resolve();
                            },
                            function (errorMsg) {
                                reject(errorMsg);
                            });
                    })
                    .catch(function (e) {
                        reject(e);
                    });
            }
            else {
                resolve();
            }
        });

    }

    // if a 4WPC license (mlf file) is defined then it must be given (applied) to the service before being used.
    // Cloud merely needs the licenseGuid on each call and On Premise needs nothing.
    //
    function if4WPCLicenseApply(sc) {
        return new Promise(function (resolve, reject) {
            if (sc.licensePath && typeof sc.licenseRevision != 'undefined') {
                MeadCo.ScriptX.Print.Licensing.applyAsync(
                    sc.licenseGuid,
                    sc.licenseRevision,
                    sc.licensePath,
                    function () {
                        resolve();
                    },
                    function (errorMsg) {
                        reject(errorMsg);
                    });
            }
            else {
                resolve();
            }
        });
    }


    // applySetting
    //
    // set given values
    function applySettings(objSettings) {

        if (typeof objSettings === "object") {
            if (typeof objSettings.header === "string") {
                MeadCo.ScriptX.Printing.header = objSettings.header;
            }
            if (typeof objSettings.footer === "string") {
                MeadCo.ScriptX.Printing.footer = objSettings.footer;
            }

            if (typeof objSettings.pageSetup === "object") {
                var ps = objSettings.pageSetup;
                if (typeof ps.units !== "undefined") {
                    MeadCo.ScriptX.Printing.SetMarginMeasure(ps.units);
                }
                if (typeof ps.orientation === "string") {
                    MeadCo.ScriptX.Printing.orientation = ps.orientation;
                }

                if (typeof ps.margins === "object") {
                    var m = ps.margins;

                    if (typeof m.left !== "undefined") {
                        MeadCo.ScriptX.Printing.leftMargin = m.left;
                    }

                    if (typeof m.right !== "undefined") {
                        MeadCo.ScriptX.Printing.rightMargin = m.right;
                    }

                    if (typeof m.top !== "undefined") {
                        MeadCo.ScriptX.Printing.topMargin = m.top;
                    }

                    if (typeof m.bottom !== "undefined") {
                        MeadCo.ScriptX.Printing.bottomMargin = m.bottom;
                    }
                }
            }
        }

    }


}(window.MeadCo = window.MeadCo || {}));

// MeadCo.Licensing - singleton
//

/**
 * @namespace MeadCoLicensing
 */

(function (topLeveNs) {
    "use strict";

    topLeveNs.Licensing = {};

    let licensing = topLeveNs.Licensing;

    licensing.Connection = {
        NONE: 0,
        ADDON: 1,
        SERVICE: 2
    };

    licensing.LibVersion = "1.8.1";
    licensing.LicMgr = null;
    licensing.Connector = licensing.Connection.NONE;

    /**
    * Performs synchronous initialisation by discovering and connecting to either COM MeadCo Security Manager or
    * the MeadCo ScriptX.Services Client Library emulation of the 'secmgr' object.
    *
    * With ScriptX.Print Services this will use a synchronous (blocking, deprecated) call to the server
    *
    * @see {@link https://meadco.github.io/ScriptX.Print.Client/ | MeadCo ScriptX.Services Client Library}
    *
    * @function Init
    * @memberof MeadCoLicensing
    * @returns {boolean} true if initialisation succeeded and implementations of the MeadCo Security Manager object is available, false if failed
    * @deprecated due to the synchronous ajax calls, use InitAsync
    */
    licensing.Init = function () {
        if (licensing.LicMgr === null) {
            console.log("licensing.Init()");
            if (findSecMgr()) {
                // what have we connected to?

                // if we are connected to the ScriptX.Print implementation
                // then check it has connected.
                if (typeof licensing.LicMgr.PolyfillInit === "function") {
                    console.log("found secmgr services");
                    console
                        .warn("Synchronous initialisation is deprecated - please update to MeadCo.Licensing.InitAsync().");
                    if (!licensing.LicMgr.PolyfillInit()) {
                        console.log("**warning** polyfill failed.");
                        licensing.LicMgr = null;
                        licensing.Connector = licensing.Connection.NONE;
                    } else {
                        licensing.Connector = licensing.Connection.SERVICE;
                    }
                } else {
                    licensing.Connector = licensing.Connection.ADDON;
                }
            } else {
                console.log("** Warning -- no secmgr **");
            }
        }
        return licensing.LicMgr !== null && typeof (licensing.LicMgr.result) !== "undefined";
    };

    /**
    * Performs asynchronous initialisation by discovering and connecting to either ScriptX.Addon or
    * the MeadCo ScriptX.Services Client Library emulation of the 'secmgr' object.
    *
    * @function InitAsync
    * @memberof MeadCoLicensing
    * @returns {Promise} 
    */
    licensing.InitAsync = function () {
        let prom;

        console.log("licensing.InitAsync()");

        return new Promise(function (resolve, reject) {
            if (licensing.LicMgr === null) {
                if (findSecMgr()) {
                    console.log("Look for polyfill");
                    if (typeof licensing.LicMgr.PolyfillInitAsync === "function") {
                        console.log("Found async secmgr services");
                        licensing.LicMgr.PolyfillInitAsync(function () {
                            console.log("polyfill initialised ok");
                            licensing.Connector = licensing.Connection.SERVICE;
                            resolve();
                        }, reject);
                    } else {
                        console.log("No polyfill, using as add-on");
                        licensing.Connector = licensing.Connection.ADDON;
                        resolve();
                    }
                } else {
                    console.log("** Warning -- no secmgr **");
                    if (reject) {
                        reject("ScriptX could not be found - is it installed?");
                    }
                }
            } else {
                if (licensing.Connector === licensing.Connection.NONE) {
                    if (reject) {
                        reject("ScriptX could not be found - is it installed?");
                    }
                } else {
                    resolve();
                }
            }
        });

    };

    /**
     * Performs synchronous initialisation 
     *
     * @function IsLicensed
     * @memberof MeadCoLicensing
     * @returns {boolean} true if a valid license is available
     *
     */
    licensing.IsLicensed = function () {

        if (licensing.Init()) {
            if (licensing.Connector === licensing.Connection.SERVICE) {
                let l = licensing.LicMgr.License;
            }

            return licensing.LicMgr.result === 0 && licensing.LicMgr.validLicense;
        }

        console.warn("WARNING :: MeadCo.Licensing.Init() failed so IsLicensed will return false.");
        return false;
    };

    /**
     * Performs asynchronous initialisation 
     *
     * @function IsLicensedAsync
     * @memberof MeadCoLicensing
     * @returns {Promise} Promise object with a resolve of the loaded license detail and reject of the error message
     *
     */
    licensing.IsLicensedAsync = function () {
        return new Promise(function (resolve, reject) {
            licensing.InitAsync()
                .then(function () {
                    if (typeof licensing.LicMgr.GetLicenseAsync === "function") {
                        licensing.LicMgr.GetLicenseAsync(resolve, reject);
                    } else {
                        resolve(licensing.LicMgr.License);
                    }
                })
                .catch(function () {
                    if (reject) {
                        reject(lookupError());
                    }
                });
        });
    };


    /**
     * Obtain the description of the last error that occurred. 
     * 
     * @function ErrorMessage
     * @memberof MeadCoLicensing
     * @returns {string} Text description of the last error or if no error has occurred, an empty string
     */
    licensing.ErrorMessage = function () {
        console.log("licensing.ErrorMessage - MeadCo Security Manager reports licensed: " + this.IsLicensed());
        return !licensing.IsLicensed() ? lookupError() : "";
    };

    // ReportError
    // Displays an alert box with details of any licensing error with any given message appended.

    /**
     * If an error has occurred, displays an alert box with details of the licensing error with any given message appended.
     * 
     * @function ReportError
     * @memberof MeadCoLicensing
     * @param {string} msg Text to append to the error message.
     */
    licensing.ReportError = function (msg) {

        let errMsg = licensing.ErrorMessage();
        if (errMsg !== "") {
            reportError(errMsg, msg);
        }
    };

    // private implementation
    // ErrorMessage
    // returns the error message that describes why licensing failed. returns emoty string if there was no error.
    let errorLicenseMsgs = new Array("Unable to locate the MeadCo License Manager object - the component may not be installed.",
        "The license for this site is not valid.",
        "The license for this site not installed on this machine.",
        "The license for this site has not been accepted by the user.",
        "There was an error loading the license. ",
        "There was an error in ScriptX.Services license management."
    );

    function lookupError() {
        let eIndex = -1;
        let msgSuffix = "";

        if (licensing.LicMgr !== null) {
            console.log("license result: " + licensing.LicMgr.result + " valid: " + licensing.LicMgr.validLicense);

            switch (licensing.LicMgr.result) {
                case 0:
                    if (!licensing.LicMgr.validLicense)
                        eIndex = 1;
                    break;

                case 5: // scriptx.print service error
                    if (typeof licensing.LicMgr.errorMessage === "string") {
                        return licensing.LicMgr.errorMessage;
                    }
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
                    msgSuffix = "\nLicense manager reported error code: 0x" + (0x100000000 + licensing.LicMgr.result).toString(16).toUpperCase();
                    break;
            }

        } else {
            eIndex = 0;
        }

        return (eIndex >= 0) ? errorLicenseMsgs[eIndex] + msgSuffix : "";

    }

    function reportError(eMsg) {
        let msg = eMsg;
        for (var i = 1; i < arguments.length; i++) {
            if (arguments[i])
                msg += "\n\n" + arguments[i];
        }
        alert(msg);
    }

    // try to find the Security Manager add-on on the page.
    // 
    function findSecMgr() {
        let l = window.secmgr || document.getElementById("secmgr");  // we assume the <object /> has an id of 'secmgr'
        if (l && l.object !== null && typeof l.object !== "undefined") {
            licensing.LicMgr = l.object;
            console.log("Found a secmgr: " + (typeof licensing.LicMgr.result !== "undefined"));
            return typeof (licensing.LicMgr.result) !== "undefined";
        }
        return false;
    }

}(window.MeadCo = window.MeadCo || {}));


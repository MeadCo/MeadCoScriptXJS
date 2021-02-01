/** 
 * MeadCo.ScriptX.Print.Licensing
 *
 * A static class wrapping calls to the server API to install / manage a client 
 * license for ScriptX.Services for Windows PC. 
 * 
 * The purpose of these libraries is to assist those with a body of client javascript code targetting use of the ScriptX Add-On for Internet Explorer. These libraries assist with continuing with a large part of the code
 * intact when transitioning to using ScriptX.Services instead/as well.
 * 
 * This module is only required when working with ScriptX Services for Windows PC.
 * 
 * A license must be 'applied' to the current html document/window before calls to printing APIs that 
 * use the license can be made.
 *
 * This module is NOT required when working with Cloud or On Premise services as the license
 * installation and management occurs at the server. 
 *
 * Requires: meadco-core.js
 * 
 * @namespace MeadCoScriptXPrintLicensing
 * 
 */

; (function (name, definition) {
    extendMeadCoNamespace(name, definition);
})('MeadCo.ScriptX.Print.Licensing', function () {
    var moduleversion = "1.8.0.0";
    var apiLocation = "v1/licensing";

    var server = ""; // url to the server, server is CORS restricted
    var licenseGuid = "";
    var licenseRevision = 0;
    var licensePath = ""; // "" => subscription (cloud) not client for Workstation, => value for client license
    var lastError = "No license applied";

    var module = this;

    /**
     * The capabilities that can be licensed.
     * 
     * @memberof MeadCoScriptXPrintLicensing
     * @typedef LicenseOptions 
     * 
     * @property {boolean} basicHtmlPrinting True if Add-on compatible basic html printing is available (always true)
     * @property {boolean} advancedPrinting True if Add-on compatible advanced html printing features are available
     * @property {boolean} enhancedFormatting True if Add-on compatible enhanced formatting is available
     * @property {boolean} printPdf True if printing PDF files is available
     * @property {boolean} printRaw True if Raw printing is available
     * */
    var LicenseOptions; // for doc generator

    /**
     * License details 
     * @memberof MeadCoScriptXPrintLicensing
     * @typedef license
     * 
     * @property {string} guid The unique id of the license
     * @property {string} company The name of the license owner
     * @property {string} companyHomePage Url of company home page 
     * @property {Date} from Date license is valid from
     * @property {Date} to Date license is vaid till 
     * @property {LicenseOptions} options The options enabled by the license
     * @property {Array.string} domains the domains the license can be used from
     * */
    var license = {};

    if (!module.jQuery) {
        MeadCo.warn("**** warning :: no jQuery");
    }

    function setServer(serverUrl) {
        MeadCo.log("License server requested: " + MeadCo.makeApiEndPoint(serverUrl, apiLocation));
        server = MeadCo.makeApiEndPoint(serverUrl, apiLocation);
    }

    function connectToServer(serverUrl, slicenseGuid) {
        // a licensing call may be made first, if the print module is available, inform it.
        var p = MeadCo.ScriptX.Print;
        if (typeof p !== "undefined" && typeof p.connectLite === "function") {
            p.connectLite(serverUrl, slicenseGuid);
        }

        setServer(serverUrl);
        licenseGuid = slicenseGuid;
        license = {};
        lastError = "No license applied";
        licenseRevision = 0;
        licensePath = "";
    }

    function getSubscriptionFromServer(resolve, reject) {
        if (server.length <= 0) {
            var msg = "MeadCo.ScriptX.Licensing : License server API URL is not set or is invalid"
            if (typeof reject === "function") {
                reject(msg);
                return;
            }
            throw new Error(msg);
        }

        if (license.length > 0) {
            if (typeof resolve === "function") {
                resolve(license);
            }
            return license;
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
                    if (typeof resolve === "function") {
                        resolve(license);
                        return;
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    lastError = MeadCo.parseAjaxError("MeadCo.ScriptX.Licensing.getSubscriptionFromServer: ", jqXHR, textStatus, errorThrown);
                    if (typeof reject === "function") {
                        reject(lastError);
                        return;
                    }
                });
            return license;
        }
        else {
            MeadCo.error("jQuery is required by ScriptX.Services");
        }

    }

    function applyLicense(slicenseGuid, revision, path, resolve, reject) {
        MeadCo.log("Apply license: " + slicenseGuid + ",revision: " + revision + ", path: " + path);

        if (server.length <= 0) {
            throw new Error("MeadCo.ScriptX.Licensing : License server API URL is not set or is invalid");
        }

        licenseGuid = slicenseGuid;
        var requestData = {
            Guid: slicenseGuid,
            Url: path,
            Revision: revision
        };

        if (module.jQuery) {
            MeadCo.log(".ajax() post: " + server);
            module.jQuery.ajax(server,
                {
                    method: "POST",
                    data: JSON.stringify(requestData),
                    dataType: "json",
                    contentType: "application/json",
                    jsonp: false,
                    cache: false,
                    async: typeof resolve === "function"
                }).done(function (data) {
                    lastError = "";
                    $.extend(license, data);
                    if (typeof resolve === "function") {
                        resolve(license);
                        return;
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    lastError = MeadCo.parseAjaxError("MeadCo.ScriptX.Print.Licensing.applyLicense: ", jqXHR, textStatus, errorThrown);
                    if (typeof reject === "function") {
                        reject(lastError);
                        return;
                    }
                });
        }
        else {
            MeadCo.error("jQuery is required by ScriptX.Services");
        }

        if (typeof resolve !== "function") {
            MeadCo.log("returning applied (sync) license: " + license.company);
            return license;
        }

        return 0;
    }

    MeadCo.log("MeadCo.ScriptX.Print.Licensing " + moduleversion + " loaded.");


    //////////////////////////////////////////////////
    // public API
    return {
        /**
         * Get the version of this module as a string major.minor.hotfix.build
         * @property {string} version
         * @memberof MeadCoScriptXPrintLicensing
         */
        get version() {
            return moduleversion;
        },

        /**
         * Specify the server to use and the license Guid. 
         * 
         * @function connect
         * @memberof MeadCoScriptXPrintLicensing
         * @param {string} serverUrl the 'root' url to the server (the api path will be added by the library)
         * @param {string} slicenseGuid the license GUID as provided by MeadCo. Optional unless will call GetLicenseAsync() without calling apply
         */
        connect: function (serverUrl, slicenseGuid) {
            connectToServer(serverUrl, slicenseGuid);
        },

        /**
         * Specify the server to use and the license Guid in order to get details on the license via the License property
         * or function GetLicenseAsync() 
         *
         * @memberof MeadCoScriptXPrintLicensing
         * @function connectLite
         * @memberof MeadCoScriptXPrintLicensing
         * @param {string} serverUrl the 'root' url to the server (the api path will be added by the library)
         * @param {string} slicenseGuid the license GUID as provided by MeadCo. Optional unless will call GetLicenseAsync() without calling apply
         * @param {number} revision the revision number of the licsnse as provided by MeadCo.
         * @param {string} path fully qualified path to the license file (.mlf file). Use the value 'warehouse' to download from the public MeadCo License warehouse
         *
         */
        connectLite: function (serverUrl, slicenseGuid, revision, path) {
            connectToServer(serverUrl, slicenseGuid);
            licenseRevision = revision;
            licensePath = path;
        },

        /**
         * Apply (make usable) the MeadCo ScriptX Client license for use with this content. If the license is not already cached it will be downloaded and cached. 
         * It is strongly suggested you request that the silent option is enabled in the license (it is by default for ScriptX.Services for Windows PC licenses)
         * 
         * The license must list the url of the content to which it is being applied.
         * 
         * This call is synchronous and therefore not recommended. Use applyAsync()         
         * 
         * @memberof MeadCoScriptXPrintLicensing
         * @function apply
         * @param {string} licenseGuid the license GUID as provided by MeadCo.
         * @param {number} revision the revision number of the licsnse as provided by MeadCo.
         * @param {string} path fully qualified path to the license file (.mlf file). Use the value 'warehouse' to download from the public MeadCo License warehouse
         * @returns {license} details the license that was sucessfully applied, null if none available
         */
        apply: function (licenseGuid, revision, path) {
            return applyLicense(licenseGuid, revision, path);
        },

        /**
         * Apply (make usable) the MeadCo ScriptX Client license for use with this content. If the license is not already cached it will be downloaded and cached.
         * It is strongly suggested you request that the silent option is enabled in the license (it is by default for ScriptX.Services for Windows PC licenses)
         *
         * The license must list the url of the content to which it is being applied.
         *
         * @memberof MeadCoScriptXPrintLicensing
         * @function applyAsync
         * @param {string} licenseGuid the license GUID as provided by MeadCo.
         * @param {number} revision the revision number of the licsnse as provided by MeadCo.
         * @param {string} path fully qualified path to the license file (.mlf file). Use the value 'warehouse' to download from the public MeadCo License warehouse

         * @param {function({license})} resolve function to call on success
         * @param {function({string})} reject function to call on failure with reason for failure
         */
        applyAsync: function (licenseGuid, revision, path, resolve, reject) {
            applyLicense(licenseGuid, revision, path, resolve, reject);
        },

        /**
         * Get the result code for the last attempt to apply a license.
         * 
         * Basically faked for the benefit of code compatibility with the add-on
         * 
         * @property {number} result
         * @memberof MeadCoScriptXPrintLicensing         
         * 
         */
        get result() {
            return lastError === "" ? 0 : 5; // => ok or not found
        },

        /**
         * Get whether a license has been applied successfully
         * 
         * @property {boolean} validLicense
         * @memberof MeadCoScriptXPrintLicensing
         *
         */
        get validLicense() {
            return typeof license.guid !== "undefined";
        },

        /**
         * Get the text of the last error.
         * 
         * @property {string} errorMessage
         * @memberof MeadCoScriptXPrintLicensing
         * 
         */
        get errorMessage() {
            return lastError;
        },

        /**
         * Get the details on the connected license. If it hasnt been applied yet, then query
         * for the details (but dont apply it and connectLite() MUST have been called).
         * 
         * Warning this function is synchronous, GetLicenseAsync() should be used.
         *
         * @property {license} License
         * @memberof MeadCoScriptXPrintLicensing
         * 
         */
        get License() {
            var l = typeof license.guid !== "undefined" ? license : getSubscriptionFromServer();
            return l;
        },

        /**
         * Get the details on the connected license. If it hasnt been applied yet, then query
         * for the details (but dont apply it and connectLite() MUST have been called).
         *
         * @memberof MeadCoScriptXPrintLicensing
         * @function GetLicenseAsync
         * @param {function({license})} resolve function to call on success
         * @param {function({string})} reject function to call on failure with reason for failure
         */
        GetLicenseAsync: function (resolve, reject) {
            getSubscriptionFromServer(resolve, reject);
        },

        // helpers for wrapper MeadCoJS - we apply the license here when working
        // with ScriptX Services for Windows PC
        PolyfillInit: function () {
            if (typeof license.guid !== "undefined") {
                return true;
            }

            if (licenseGuid === "")
                return false;

            if (licensePath === "") //subscription only
                return true;

            applyLicense(licenseGuid, licenseRevision, licensePath);
            return typeof license.guid !== "undefined";
        },

        PolyfillInitAsync: function (resolve, reject) {
            if (typeof license.guid !== "undefined" || licensePath === "") {
                resolve(license);
            }
            else
                applyLicense(licenseGuid, licenseRevision, licensePath, resolve, reject);
        }
    };

});

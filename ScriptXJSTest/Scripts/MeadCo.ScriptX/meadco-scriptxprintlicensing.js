/*! 
 * MeadCo.ScriptX.Print.Licensing (support for modern browsers and IE 11) JS client library
 * Copyright 2017-2018 Mead & Company. All rights reserved.
 * https://github.com/MeadCo/ScriptX.Print.Client
 *
 * This module is only required when working with ScriptX.Services for Windows PC.
 * 
 * Released under the MIT license
 */

; (function (name, definition) {
    extendMeadCoNamespace(name, definition);
})('MeadCo.ScriptX.Print.Licensing', function () {
    var moduleversion = "1.4.8.0";
    var apiLocation = "v1/licensing";

    var server = ""; // url to the server, server is CORS restricted
    var licenseGuid = "";
    var licenseRevision = 0;
    var licensePath = ""; // "" => subscription (cloud) not client for Workstation, => value for client license
    var lastError = "";

    var module = this;
    var license = {};

    var bConnected = false;

    if (!module.jQuery) {
        MeadCo.log("**** warning :: no jQuery");
    }

    function setServer(serverUrl) {
        MeadCo.log("License server requested: " + MeadCo.makeApiEndPoint(serverUrl, apiLocation));
        server = MeadCo.makeApiEndPoint(serverUrl, apiLocation);
    }

    function connectToServer(serverUrl,slicenseGuid) {
        setServer(serverUrl);
        licenseGuid = slicenseGuid;
    }

    function getSubscriptionFromServer(resolve, reject) {
        if (server.length <= 0) {
            throw new Error("MeadCo.ScriptX.Licensing : License server API URL is not set or is invalid");
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
                    MeadCo.log("**warning: failure in MeadCo.ScriptX.Licensing.getSubscriptionFromServer: " + errorThrown);
                    lastError = errorThrown;
                    if (typeof reject == "function") {
                        reject(errorThrown);
                        return;
                    }
                });
            return license;
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
        }

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
                    MeadCo.log("**warning: failure in MeadCo.ScriptX.Print.Licensing.applyLicense: " + errorThrown);
                    lastError = errorThrown;
                    if (typeof reject == "function") {
                        reject(errorThrown);
                        return;
                    }
                });
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
        get version() {
            return moduleversion;
        },

        connect: function (serverUrl, slicenseGuid) {
            connectToServer(serverUrl,slicenseGuid);
        },

        connectLite: function (serverUrl, slicenseGuid, sRevision, sPath) {
            connectToServer(serverUrl,slicenseGuid);
            licenseRevision = sRevision;
            licensePath = sPath;
        },

        apply: function(licenseGuid, revision, path) {
            return applyLicense(licenseGuid, revision, path);
        },

        applyAsync: function(licenseGuid, revision, path, resolve, reject) {
            applyLicense(licenseGuid, revision, path, resolve, reject);
        },

        get result() {
            return lastError === "" ? 0 : 5; // => ok or not found
        },

        get validLicense() {
            return typeof license.guid !== "undefined";
        },

        get License() {
            var l = typeof license.guid !== "undefined" ? license : getSubscriptionFromServer();
            return l;
        },

        GetLicenseAsync: function (resolve, reject) {
            getSubscriptionFromServer(resolve, reject);
        },

        // helpers for wrapper MeadCoJS - we apply the license here when working
        // with ScriptX.Services for Windows PC
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

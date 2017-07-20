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

// MeadCo.ScriptX 
//
(function (topLevelNs) {
    "use strict";

    if (typeof topLevelNs["ScriptX"] === "undefined") {
        console.log("intialising new ScriptX package");
        topLevelNs.ScriptX = {};
    }

    var scriptx = topLevelNs.ScriptX;

    scriptx.LibVersion = "1.2.0";
    scriptx.Printing = null;
    scriptx.Utils = null;

    console.log("Initialising MeadCo.ScriptX: " + scriptx.LibVersion);

    // Init()
    // Simple initialisation of the library
    // returns true if the MeadCo ScriptX factory object and printing object are available
    //
    scriptx.Init = function () {
        if (scriptx.Printing == null) {
            console.log("scriptx.Init()");
            var f = window.factory || document.getElementById("factory"); // we assume the <object /> has an id of 'factory'
            if (f && f.object != null) {
                console.log("found factory");
                scriptx.Utils = f.object;
                scriptx.Printing = f.printing;

                // if we are connected to the ScriptX.Print implementation
                // then check it has connected.
                if (typeof f.printing.PolyfillInit === "function") {
                    console.log("found polyfillinit()");
                    if (!f.printing.PolyfillInit()) {
                        console.log("**warning** polyfill failed.")
                        scriptx.Printing = null;
                    }
                }
            } else {
                console.log("** Warning -- no factory **");
            }
        }
        return scriptx.Printing != null;
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

// MeadCo.Licensing 
//
(function (topLeveNs) {
    "use strict";

    topLeveNs.Licensing = {};

    var licensing = topLeveNs.Licensing;

    licensing.LibVersion = "1.1.0";
    licensing.LicMgr = null;

    licensing.Init = function () {
        if (licensing.LicMgr == null) {
            var l = window.secmgr || document.getElementById("secmgr");  // we assume the <object /> has an id of 'secmgr'
            if (l && l.object)
                licensing.LicMgr = l.object;
        }
        return licensing.LicMgr != null && typeof (licensing.LicMgr.result) != "undefined";
    }

    // IsLicensed
    // Returns true if the document is licensed and advanced functionality will be available
    licensing.IsLicensed = function () {
        if (licensing.Init()) {
            return licensing.LicMgr.result == 0 && licensing.LicMgr.validLicense;
        }

        console.log("WARNING :: MeadCo.Licensing.Init() failed so IsLicensed will return false.");
        return false;
    }

    // ErrorMessage
    // returns the error message that describes why licensing failed. returns emoty string if there was no error.
    var errorLicenseMsgs = new Array("Unable to locate the MeadCo License Manager object - the component may not be installed.",
			"The license for this site is not valid.",
			"The license for this site not installed on this machine.",
			"The license for this site has not been accepted by the user.",
			"There was an error loading the license. "
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


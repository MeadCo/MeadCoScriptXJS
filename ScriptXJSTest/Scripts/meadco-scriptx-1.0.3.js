// Copyright (c) 2013, Mead & Company Ltd. All rights reserved.
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
// v1.0.4 - 17 June 2016
//
// Add ability to retrieve the license error message. 
// Fix some bugs.
// Improve error messsage text.
//
// v1.0.2 - 6 August 2013
//
// Pagesetup and Printsetup wrappers return the wrapped function return value.
//
// v1.0.1 - 19 April 2013
//
// More comments on the code.
//
// v1.0.0
//
// Initial GitHub/NuGet public release after many internal versions.
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

var MeadCo = {
    LibVersion: "1.0.3",

    // MeadCo.ScriptX 
	ScriptX: {
		// Public interface
		Printing: null,
		Utils: null,
		
		// Init()
		// Simple initialisation of the library
		// returns true if the MeadCo ScriptX factory object and printing object are available
		//
		Init: function() {
			if ( this.Printing == null ) {
				var f = document.getElementById("factory"); // we assume the <object /> has an id of 'factory'
				if ( f && f.object != null ) {
					this.Utils = f.object;
					this.Printing = f.printing;
				}
			}
			return this.Printing != null;
		},

		// InitWithVersion(strVersion)
		// Initialises the library and ensures that the installed version is at least strVersion where strVersion is a dotted version number (e.g. "7.1.2.65")
		// 
		InitWithVersion : function(strVersion) {
			var bok = false;
			if ( this.Init() ) {
				bok = this.IsVersion(strVersion);
				if ( !bok )
					alert("ScriptX v" + strVersion + " or later is required.\nYou are using a previous version and errors may occur.");
			}
			return bok;
		},

		// IsVersion
		// Returns true if the installed version is at least strVersion where strVersion is a dotted version number (e.g. "7.1.2.65")
		IsVersion: function(strVersion) {
			return this.IsComponentVersion("ScriptX.Factory", strVersion);
		},

		// Version
		// Returns the installed version number of ScriptX
		Version: function() {
			return this.GetComponentVersion("ScriptX.Factory");
		},

		// PrintPage
		// Print the current document, with optional prompting (no prompt in the internetzone requires a license)
		PrintPage: function(bPrompt) {
			if (this.Init())
				return this.Printing.Print(bPrompt);
			return false;
		},

		// PreviewPage
		// Preview the current document
		PreviewPage: function() {
			if (this.Init())
				this.Printing.Preview();
		},

		// PreviewFrame
		// Preview the content of the *named* frame.
		PreviewFrame: function(frame) {
			if (this.Init())
				this.Printing.Preview(typeof (frame) == "string" ? (this.IsVersion("6.5.439.30") ? frame : eval("window." + frame)) : frame);
		},

		// PrintFrame
		// Print the content of the *named* frame with optional prompting (no prompt in the internetzone requires a license)
		PrintFrame: function(frame, bPrompt) {
			if (this.Init())
				return this.Printing.Print(bPrompt, typeof (frame) == "string" ? (this.IsVersion("6.5.439.30") ? frame : eval("window." + frame)) : frame);
			return false;                    
		},

		PageSetup: function() {
			if (this.Init())
				return this.Printing.PageSetup();
			return false;
		},

		PrintSetup: function() {
			if (this.Init())
				return this.Printing.PrintSetup();
			return false;
		},

		// HasOrientation
		// Returns true if the 'orientation' property is available, otherwise the 'portrait' property must be used.
		//
		HasOrientation: function() {
			return this.IsComponentVersion("ScriptX.Factory", "7.0.0.1");
		},

		// GetAvailablePrinters
		// returns an array of the names of the printers on the system
		//
		GetAvailablePrinters: function() {
			var plist = new Array();
			var name;
			if ( this.Init() ) {
				try {
					for (var i = 0; (name = this.Printing.EnumPrinters(i)).length > 0 ; i++ ) {
						plist.push(name);
					}
				} catch ( e ) {}
			}
			return plist;
		},

		// GetComponentVersion
		// returns the version number of a COM component - compatible with v7.0 and earlier implementation. (ScriptX v7.1 has an easier to use implementation)
		GetComponentVersion: function(sComponent) {
			var a = new Object();
			var b = new Object();
			var c = new Object();
			var d = new Object();
			var s = "(Not installed)";

			try {
				document.getElementById("factory").GetComponentVersion(sComponent, a, b, c, d);
				s = a[0] + "." + b[0] + "." + c[0] + "." + d[0];
			}
			catch (e) {
			}

			return s;
		},

		ScriptXVersion: function() {
				return this.GetComponentVersion("ScriptX.Factory");    
		},

		SecurityManagerVersion: function() {
				return this.GetComponentVersion("MeadCo.SecMgr");    
		},

	    // IsComponentVersion
	    // Returns true if the installed version of a COM component is at least the given version
		IsComponentVersion: function(strComponentName, strVersionRequired) {
			return this._compareVersions(this.GetComponentVersion(strComponentName), strVersionRequired);
		},

		// Private implementation

		// compareVersions
		//
		// Return true if v1 is later than or equal to v2
		//
		_compareVersions: function(v1, v2) {
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

	},

    // MeadCo.Licensing :: helpers for working with security manager
	Licensing : {
		LicMgr: null,
		Init: function() {
			if ( this.LicMgr == null ) {
				var l = document.getElementById("secmgr");  // we assume the <object /> has an id of 'secmgr'
				if ( l && l.object ) 
					this.LicMgr = l.object;
			}
			return this.LicMgr != null && typeof(this.LicMgr.result) != "undefined";
		},

		// IsLicensed
		// Returns true if the document is licensed and advanced functionality will be available
		IsLicensed: function() {
			if ( this.Init() ) {
				return this.LicMgr.result == 0 && this.LicMgr.validLicense;
			}

		    console.log("WARNING :: MeadCo.Licensing.Init() failed so IsLicensed will return false.");
			return false;
		},

	    // ErrorMessage
        // returns the error message that describes why licensing failed. returns emoty string if there was no error.
        ErrorMessage: function() {
            var msg = "";

            console.log("MeadCo Security Manager reports licensed: " + this.IsLicensed());
            if (!this.IsLicensed()) {
                var eIndex = -1;
                var msgSuffix = "";

                if (this.LicMgr != null) {
                    console.log("license result: " + this.LicMgr.result + " valid: " + this.LicMgr.validLicense);

                    switch (this.LicMgr.result) {
                        case 0:
                            if (!this.LicMgr.validLicense)
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
                    msg = this._errorLicenseMsgs[eIndex] + msgSuffix;
                }
            }

            return msg;
        },

		// ReportError
		// Displays an alert box with details of any licensing error with any given message appended.
		ReportError: function(msg) {

		    var errMsg = this.ErrorMessage();
            if ( errMsg !== "" ) {
                this._reportError(errMsg, msg);
            }

		},

		_reportError: function(eMsg) {
		    var msg = eMsg;
			for (var i=1; i<arguments.length; i++) {
				if ( arguments[i] ) 
					msg += "\n\n" + arguments[i];
			}
			alert(msg);
		},

		_errorLicenseMsgs : new Array("Unable to locate the MeadCo License Manager object - the component may not be installed.",
				"The license for this site is not valid.",
				"The license for this site not installed on this machine.",
				"The license for this site has not been accepted by the user.",
				"There was an error loading the license. "
				)
	}
}

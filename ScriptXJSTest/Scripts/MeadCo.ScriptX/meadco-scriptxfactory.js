/*!
 * MeadCo ScriptX 'window.factory' shim (support for modern browsers and IE 11) JS client library
 * Copyright 2017 Mead & Company. All rights reserved.
 * https://github.com/MeadCo/ScriptX.Print.Client
 *
 * Released under the MIT license
 */

// we anti-polyfill <object id="factory" />
// enabling old code to run in modern browsers
//
; (function (name, definition,undefined) {

    if ( this[name] != undefined || document.getElementById(name) != null ) {
        console.log("ScriptX factory anti-polyfill believes it may not be requred.");
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

    console.log("ScriptX factory anti-polyfill believes it is requred.");
    var theModule = definition();

    // Assign to the global object (window)
    (this)[name] = theModule;

})('factory', function () {
    // If this is executing, we believe we are needed.
    // protected API
    var moduleversion = "0.0.5.15";
    var emulatedVersion = "8.0.0.0";
    var module = this;
    var printApi = MeadCo.ScriptX.Print;

    function log (str) {
        console.log("factory anti-polyfill :: " + str);
    }

    // extend the namespace
    module.extendFactoryNamespace = function(name, definition) {
        var theModule = definition();

        log("MeadCo factory extending namespace: " + name);
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


    log("'factory' loaded.");

    // public API.
    return {
        log: log,

        // 'factory' functions
        GetComponentVersion: function(sComponent, a, b, c, d) {
            log("factory.object.getcomponentversion: " + sComponent);
            var v = emulatedVersion;

            switch( sComponent.toLowerCase() ) {
                case "scriptx.factory":
                    v = emulatedVersion;
                    break;

                case "scriptx.factory.cloud":
                    v = moduleversion;
                    break;

                case "meadco.secmgr":
                try {
                    v = module.secmgr.version;
                } catch (e) {
                }
                break;

                case "meadco.triprint":
                    try {
                        v = MeadCo.ScriptX.Print.HTML.version;
                    } catch (e) {
                    }
                    break;
            }

            v = v.split(".");
            a[0] = v[0];
            b[0] = v[1];
            c[0] = v[2];
            d[0] = v[3];
        },

        get ScriptXVersion() { return emulatedVersion },
        get SecurityManagerVersion() { return emulatedVersion },

        baseURL : function(sRelative) {
            return window.location.href.substring(0, window.location.href.length - window.location.pathname.length);
        },

        relativeURL : function(sUrl) {
            throw "MeadCo.ScriptX.Print :: relativeUrl is not implemented yet.";
        }
    };
});

; (function (name, definition) {
    if (typeof extendFactoryNamespace === "function") {
        extendFactoryNamespace(name, definition);
    }
})('factory.printing', function () {

    // protected API
    var printHtml = MeadCo.ScriptX.Print.HTML;
    var settings = printHtml.settings;
    var printApi = MeadCo.ScriptX.Print;
    var module = this;

    module.factory.log("factory.Printing loaded.");

    if (this.jQuery) {
        module.factory.log("Looking for auto connect");
        $("[data-meadco-server]").each(function () {
            var $this = $(this);
            module.factory.log("Auto connect to: " + $this.data("meadco-server") + "with license: " + $this.data("meadco-license"));
            printHtml.connect($this.data("meadco-server"), $this.data("meadco-license"));
            return false;
        });
    }

    if (typeof module.print === "function") {
        module.factory.log("overwriting module.print");
        module.print = function() {
            module.factory.log("window.print() called and being handled.");
            printHtml.printDocument(true);
        }
    }

    // public API
    return {
        // basic properties
        //

        set header(str) {
            module.factory.log("set factory.printing.header: " + str);
            settings.header = str;
        },

        get header() {
            return settings.header;
        },

        set footer(str) {
            settings.footer = str;
        },

        get footer() {
            return settings.footer;
        },

        set headerFooterFont(str) {
            settings.headerFooterFont = str;
        },

        get headerFooterFont() {
            return settings.headerFooterFont;
        },


        set orientation(sOrientation) {
            switch (sOrientation.toLowerCase()) {
                case "landscape":
                    settings.page.orientation = printHtml.PageOrientation.LANDSCAPE;
                    break;

                case "portrait":
                    settings.page.orientation = printHtml.PageOrientation.PORTRAIT;
                    break;
            }
        },

        get orientation() {
            return settings.page.orientation === printHtml.PageOrientation.PORTRAIT ? "portrait" : "landscape";
        },

        set portrait(bPortrait) {
            settings.page.orientation = bPortrait ? printHtml.PageOrientation.PORTRAIT : printHtml.PageOrientation.LANDSCAPE;
        },

        get portrait() {
            return settings.page.orientation === printHtml.PageOrientation.PORTRAIT;
        },

        set leftMargin(n) {
            settings.page.margins.left = n;
        },

        get leftMargin() {
            return settings.page.margins.left;
        },

        set topMargin(n) {
            settings.page.margins.top = n;
        },

        get topMargin() {
            return settings.page.margins.top;
        },

        set bottomMargin(n) {
            settings.page.margins.bottom = n;
        },

        get bottomMargin() {
            return settings.page.margins.bottom;
        },

        set rightMargin(n) {
            settings.page.margins.right = n;
        },

        get rightMargin() {
            return settings.page.margins.right;
        },

        // templateURL is a no-op at this time. In the future may
        // enable alternative server behaviour.
        set templateURL(sUrl) {
        },

        get templateURL() {
            return "MeadCo://default";
        },

        // basic functions
        //

        // No longer relevant, has returned true since IE 6 and was
        // a proxy for testing if the browser was IE5.5 or later!
        IsTemplateSupported : function() {
            return true;
        },

        PageSetup : function() {
            if (MeadCo.ScriptX.Print.UI) {
                MeadCo.ScriptX.Print.UI.PageSetup();
            } else {
                printApi.reportFeatureNotImplemented("Page setup dialog");
            }
        },

        PrintSetup : function() {
            if (MeadCo.ScriptX.Print.UI) {
                MeadCo.ScriptX.Print.UI.PrinterSettings();
            } else {
                printApi.reportFeatureNotImplemented("Print settings dialog");
            }
        },

        Preview : function(sOrOFrame) {
            printApi.reportFeatureNotImplemented("Preview");
        },

        Print : function(bPrompt, sOrOFrame) { // needs and wants update to ES2015
            if (typeof (bPrompt) === 'undefined') bPrompt = true;
            if (typeof (sOrOFrame) === 'undefined') sOrOFrame = null;

            if (sOrOFrame != null) {
                var sFrame = typeof (sOrOFrame) === 'string' ? sOrOFrame : sOrOFrame.id;
                return printHtml.printFrame(sFrame, bPrompt);
            }

            return printHtml.printDocument(bPrompt);
        },

        PrintHTML : function(sUrl, bPrompt) {
            if (typeof (bPrompt) === 'undefined') bPrompt = true;

            // if a relative URL supplied then add the base URL of this website
            if (!(sUrl.indexOf('http://') === 0 || sUrl.indexOf('https://') === 0)) {
                var baseurl = module.factory.baseURL();
                if (baseurl.substring(baseurl.length - 1, baseurl.length) !== "/") {
                    if (sUrl.substring(0, 1) !== "/") {
                        sUrl = baseurl + "/" + sUrl;
                    } else {
                        sUrl = baseurl + sUrl;
                    }
                } else {
                    if (sUrl.substring(0, 1) !== "/") {
                        sUrl = baseurl + sUrl;
                    } else {
                        sUrl = baseurl + sUrl.substring(1);
                    }
                }
            }

            return printHtml.printFromUrl(sUrl);
        },

        PrintHTMLEx: function (sUrl, bPrompt, fnCallback, data) {
            printApi.reportFeatureNotImplemented("PrintHtmlEx");
        },

        // advanced (aka licensed properties - the server will reject
        // use if no license available)
        set units(enumUnits) {
            // TODO: Check licensed (or will obviously fail on the server)
            this.SetMarginMeasure(enumUnits);
        },

        get units() {
            return this.GetMarginMeasure();
        },

        // advanced functions
        set paperSize(sPaperSize) {
            printApi.deviceSettings.paperSizeName = sPaperSize;
        },

        get paperSize() {
            return printApi.deviceSettings.paperSizeName;
        },

        set paperSource(sPaperSource) {
            printApi.deviceSettings.paperSourceName = sPaperSource;
        },

        get paperSource() {
            return printApi.deviceSettings.paperSourceName;
        },

        set paperSource2(sPaperSource) {
            printApi.reportFeatureNotImplemented("set paperSource2");
        },

        get paperSource2() {
            printApi.reportFeatureNotImplemented("get paperSource2");
        },

        get pageWidth() {
            return printApi.deviceSettings.paperPageSize.width;
        },

        get pageHeight() {
            return printApi.deviceSettings.paperPageSize.height         ;
        },

        set copies(nCopies) {
            printApi.deviceSettings.copies = nCopies;
        },

        get copies() {
            return printApi.deviceSettings.copies;
        },

        set collate(bCollate) {
            printApi.deviceSettings.collate = (bCollate === true || bCollate === 1) ? printHtml.CollateOptions.TRUE : printHtml.CollateOptions.FALSE;
        },

        get collate() {
            return printApi.deviceSettings.collate === printHtml.CollateOptions.TRUE;
        },

        set duplex(duplex) {
            printApi.reportFeatureNotImplemented("set Duplex");
        },

        get duplex() {
            printApi.reportFeatureNotImplemented("get Duplex");
        },

        set duplex2(duplex) {
            printApi.reportFeatureNotImplemented("set Duplex2");
        },

        get duplex2() {
            printApi.reportFeatureNotImplemented("get Duplex2");
        },

        set onbeforeprint(fn) {
            printApi.reportFeatureNotImplemented("onbeforeprint");
        },

        set onafterprint(fn) {
            printApi.reportFeatureNotImplemented("onafterprint");
        },

        set onuserprintpreview(fn) {
            printApi.reportFeatureNotImplemented("onuserprintpreview");
        },

        get CurrentPrinter() {
            return printApi.printerName;
        },

        set CurrentPrinter(sPrinterName) {
            printApi.printerName = sPrinterName;
        },

        get currentPrinter() {
            return printApi.printerName;
        },

        set currentPrinter(sPrinterName) {
            printApi.printerName = sPrinterName;
        },

        set printer(sPrinterName) {
            printApi.printerName = sPrinterName;
        },

        set printToFileName(fn) {
            printApi.reportFeatureNotImplemented("printToFileName");
        },

        get printBackground() {
            return settings.printBackgroundColorsAndImages;
        },

        set printBackground(bPrintBackground) {
            settings.printBackgroundColorsAndImages = bPrintBackground;
        },

        get viewScale() {
            return settings.viewScale;
        },

        set viewScale(x) {
            settings.viewScale = x;
        },

        set unprintableLeft(n) {
            printApi.reportFeatureNotImplemented("set unprintableLeft");
        },

        get unprintableLeft() {
            printApi.reportFeatureNotImplemented("get unprintableLeft");
        },

        set unprintableRight(n) {
            printApi.reportFeatureNotImplemented("set unprintableRight");
        },

        get unprintableRight() {
            printApi.reportFeatureNotImplemented("get unprintableRight");
        },

        set unprintableTop(n) {
            printApi.reportFeatureNotImplemented("set unprintableTop");
        },

        get unprintableTop() {
            printApi.reportFeatureNotImplemented("get unprintableTop");
        },

        set unprintableBottom(n) {
            printApi.reportFeatureNotImplemented("set unprintableBottom");
        },

        get unprintableBottom() {
            printApi.reportFeatureNotImplemented("get unprintableBottom");
        },


        // advanced methods :: require a subscription/license.
        EnumPrinters: function (index) {
            if (index === 0) {
                return this.CurrentPrinter;
            }
            // TODO: Support many printers
            else if (!index) {
                return new Array(this.CurrentPrinter);
            }
            else {
                return "";
            }
        },

        EnumJobs : function() {
            printApi.reportFeatureNotImplemented("EnumJobs");
        },

        GetJobsCount : function() {
            printApi.reportFeatureNotImplemented("GetJobsCount");
        },

        printerControl: function (value) {
            // for now ignore value parameter and return an array of paper sizes in the Forms property

            return {
                Forms : ["A3", "A4", "A5", "Letter"],
                Bins : ["Automatically select", "Printer auto select", "Manual Feed Tray", "Tray 1", "Tray 2", "Tray 3", "Tray 4"],
                get Name() {
                    printApi.reportFeatureNotImplemented("printerControl.Name");
                },
                get Jobs() {
                    printApi.reportFeatureNotImplemented("printerControl.Jobs");
                },
                get port() {
                    printApi.reportFeatureNotImplemented("printerControl.port");
                },
                get attributes() {
                    printApi.reportFeatureNotImplemented("printerControl.attributes");
                },
                get serverName() {
                    printApi.reportFeatureNotImplemented("printerControl.serverName");
                },
                get shareName() {
                    printApi.reportFeatureNotImplemented("printerControl.shareName");
                },
                get location() {
                    printApi.reportFeatureNotImplemented("printerControl.location");
                },
                get isLocal() {
                    printApi.reportFeatureNotImplemented("printerControl.isLocal");
                },
                get isNetwork() {
                    printApi.reportFeatureNotImplemented("printerControl.isNetwork");
                },
                get isShared() {
                    printApi.reportFeatureNotImplemented("printerControl.isShared");
                },
                Purge: function() {
                    printApi.reportFeatureNotImplemented("printerControl.Purge()");
                },
                Pause: function() {
                    printApi.reportFeatureNotImplemented("printerControl.Pause()");
                },
                Resume: function() {
                    printApi.reportFeatureNotImplemented("printerControl.Resume()");
                }
            };
        },

        GetMarginMeasure: function() {
            return settings.page.units === printHtml.PageMarginUnits.INCHES ? 2 : 1;
        },

        SetMarginMeasure: function (enumUnits) {
            settings.page.units = enumUnits === 2 ? printHtml.PageMarginUnits.INCHES : printHtml.PageMarginUnits.MM;
        },

        SetPrintScale: function (value) {
            settings.viewScale = value;
        },

        IsSpooling : function() {
            printApi.reportFeatureNotImplemented("IsSpooling");
        },

        OwnQueue: function () {
            printApi.reportFeatureNotImplemented("OwnQueue");
        },

        SetPageRange: function () {
            printApi.reportFeatureNotImplemented("SetPageRange");
        },

        SetPreviewZoom: function () {
            printApi.reportFeatureNotImplemented("SetPreviewZoom");
        },

        Sleep: function () {
            printApi.reportFeatureNotImplemented("Sleep");
        },

        TotalPrintPages: function () {
            printApi.reportFeatureNotImplemented("TotalPrintPages");
        },

        WaitForSpoolingComplete: function () {
            printApi.reportFeatureNotImplemented("WaitForSpoolingComplete");
        },

        // helpers for wrapper MeadCoJS
        PolyfillInit: function () {
            return MeadCo.ScriptX.Print.isConnected;
        }
    };

});

; (function (name, definition) {
    if (typeof extendFactoryNamespace === "function") {
        extendFactoryNamespace(name, definition);
    }
})('factory.object', function () {

    // protected API
    var module = this;

    factory.log("factory.object loaded.");

    // public API
    return this.factory;
});

; (function (name, definition) {
    if (typeof extendFactoryNamespace === "function") {
        extendFactoryNamespace(name, definition);
    }
})('factory.object.js', function () {

    // protected API
    var module = this;

    factory.log("factory.object.js loaded.");

    // public API
    return {
        FormatNumber: function (arg) {
            if (isNaN(arg)) {
                return 0;
            } else {
                if (typeof arg === 'string') {
                    return Number(arg);
                } else {
                    return arg;
                }
            }
        }
    };
});
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
// static singleton instances.
//
; (function (name, definition, undefined) {

    if (this[name] != undefined || document.getElementById(name) != null) {
        console.log("ScriptX factory anti-polyfill believes it may not be requred.");
        if (this[name] != undefined) {
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
    var moduleversion = "1.4.8.0";
    var emulatedVersion = "8.0.0.0";
    var module = this;

    function log(str) {
        console.log("factory anti-polyfill :: " + str);
    }

    // extend the namespace
    module.extendFactoryNamespace = function (name, definition) {
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
        GetComponentVersion: function (sComponent, a, b, c, d) {
            log("factory.object.getcomponentversion: " + sComponent);
            var v = emulatedVersion;

            switch (sComponent.toLowerCase()) {
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

        baseURL: function (sRelative) {
            return window.location.href.substring(0, window.location.href.length - window.location.pathname.length);
        },

        relativeURL: function (sUrl) {
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
    var licenseApi = MeadCo.ScriptX.Print.Licensing;

    var module = this;

    module.factory.log("factory.Printing loaded.");

    function promptAndPrint(bPrompt, fnPrint, fnNotifyStarted) {
        if (typeof (bPrompt) === 'undefined') bPrompt = true;
        var lock = printApi.ensureSpoolingStatus();
        if (bPrompt) {
            if (MeadCo.ScriptX.Print.UI) {
                MeadCo.ScriptX.Print.UI.PrinterSettings(function (dlgAccepted) {
                    if (dlgAccepted) {
                        MeadCo.log("promptAndPrint requesting print ...");
                        fnNotifyStarted(fnPrint());
                    }
                    else
                        fnNotifyStarted(false);

                    printApi.freeSpoolStatus(lock);
                });

                MeadCo.log("promptAndPrint exits ...");
                return true;
            }
            console.warn("prompted print requested but no UI library loaded");
        }
        fnNotifyStarted(fnPrint());
        printApi.freeSpoolStatus(lock);
        return true;
    }

    function printHtmlContent(sUrl, bPrompt, fnNotifyStarted, fnCallback, data) {
        var sHtml = "";

        // if requesting snippet then trim to just the html
        if (sUrl.indexOf('html://') === 0) {
            sHtml = sUrl.substring(7);
            var docType = "<!doctype";

            // add-on scripters might also add doctype but the server handles this 
            if (sHtml.substr(0, docType.length).toLowerCase() === docType) {
                sHtml = sHtml.substring(sHtml.indexOf(">") + 1);
            }
        } else {
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
        }

        return promptAndPrint(bPrompt,
            function () {
                MeadCo.log("printHtmlContent requesting print ...");
                return sHtml.length > 0 ? printHtml.printHtml(sHtml, null, fnCallback, data) : printHtml.printFromUrl(sUrl, null, fnCallback, data);
            }, fnNotifyStarted);
    }

    if (typeof module.print === "function") {
        module.factory.log("overwriting module.print");
        module.print = function () {
            module.factory.log("window.print() called and being handled.");
            // printHtml.printDocument(true);
            promptAndPrint(
                true,
                function () {
                    return printHtml.printDocument();
                },
                function() {});
        }
    }

    var iEnhancedFormatting = {
        get allPagesHeader() {
            return settings.extraHeadersAndFooters.allPagesHeader;
        },
        set allPagesHeader(v) {
            settings.extraHeadersAndFooters.allPagesHeader = v;
        },

        get allPagesFooter() {
            return settings.extraHeadersAndFooters.allPagesFooter;
        },
        set allPagesFooter(v) {
            settings.extraHeadersAndFooters.allPagesFooter = v;
        },

        get firstPageHeader() {
            return settings.extraHeadersAndFooters.firstPageHeader;
        },
        set firstPageHeader(v) {
            settings.extraHeadersAndFooters.firstPageHeader = v;
        },

        get firstPageFooter() {
            return settings.extraHeadersAndFooters.firstPageFooter;
        },
        set firstPageFooter(v) {
            settings.extraHeadersAndFooters.firstPageFooter = v;
        },

        get extraFirstPageFooter() {
            return settings.extraHeadersAndFooters.extraFirstPageFooter;
        },
        set extraFirstPageFooter(v) {
            settings.extraHeadersAndFooters.extraFirstPageFooter = v;
        },

        get allHeaderHeight() {
            return settings.extraHeadersAndFooters.allHeaderHeight;
        },
        set allHeaderHeight(v) {
            if (typeof v !== "number") {
                throw "Invalid argument";
            }
            settings.extraHeadersAndFooters.allHeaderHeight = v;
        },

        get allFooterHeight() {
            return settings.extraHeadersAndFooters.allFooterHeight;
        },
        set allFooterHeight(v) {
            if (typeof v !== "number") {
                throw "Invalid argument";
            }
            settings.extraHeadersAndFooters.allFooterHeight = v;
        },

        get firstHeaderHeight() {
            return settings.extraHeadersAndFooters.firstHeaderHeight;
        },
        set firstHeaderHeight(v) {
            if (typeof v !== "number") {
                throw "Invalid argument";
            }
            settings.extraHeadersAndFooters.firstHeaderHeight = v;
        },

        get firstFooterHeight() {
            return settings.extraHeadersAndFooters.firstFooterHeight;
        },
        set firstFooterHeight(v) {
            if (typeof v !== "number") {
                throw "Invalid argument";
            }
            settings.extraHeadersAndFooters.firstFooterHeight = v;
        },

        get extraFirstFooterHeight() {
            return settings.extraHeadersAndFooters.extraFirstFooterHeight;
        },
        set extraFirstFooterHeight(v) {
            if (typeof v !== "number") {
                throw "Invalid argument";
            }
            settings.extraHeadersAndFooters.extraFirstFooterHeight = v;
        },

        get pageRange() {
            return settings.pageRange;
        },
        set pageRange(v) {
            settings.pageRange = v;
        },

        get printingPass() {
            var v = "";
            switch (settings.printingPass) {
            case printHtml.PrintingPasses.ALL:
                v = "all";
                break;

            case printHtml.PrintingPasses.ODD:
                v = "odd";
                break;

            case printHtml.PrintingPasses.EVEN:
                v = "even";
                break;

            case printHtml.PrintingPasses.ODDANDEVEN:
                v = "odd&even";
                break;
            }
            return v;
        },

        set printingPass(v) {
            var x = printHtml.PrintingPasses.ALL;
            if (typeof v === "string") {
                switch (v.toLowerCase()) {
                case "odd":
                    x = printHtml.PrintingPasses.ODD;
                    break;

                case "even":
                    x = printHtml.PrintingPasses.EVEN;
                    break;

                case "odd&even":
                    x = printHtml.PrintingPasses.ODDANDEVEN;
                    break;
                }
            }
            settings.printingPass = x;
        }
    };

    printApi.useAttributes();

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
        IsTemplateSupported: function () {
            return true;
        },

        PageSetup: function (fnNotify) {
            if (typeof fnNotify === "undefined") {
                console.warn("PageSeup API in ScriptX.Print Service is not synchronous, there is no return value.");
                fnNotify = function (bDlgOK) { console.log("PageSetugDlg: " + bDlgOK); }
            }

            if (MeadCo.ScriptX.Print.UI) {
                MeadCo.ScriptX.Print.UI.PageSetup(fnNotify);
            } else {
                printApi.reportFeatureNotImplemented("Page setup dialog");
            }
        },

        PrintSetup: function (fnNotify) {
            if (typeof fnNotify === "undefined") {
                console.warn("PrintSetup API in ScriptX.Print Service is not synchronous, there is no return value.");
                fnNotify = function (bDlgOK) { console.log("PrintSetugDlg: " + bDlgOK); }
            }

            if (MeadCo.ScriptX.Print.UI) {
                MeadCo.ScriptX.Print.UI.PrinterSettings(fnNotify);
            } else {
                printApi.reportFeatureNotImplemented("Print settings dialog");
            }
        },

        Preview: function (sOrOFrame) {
            printApi.reportFeatureNotImplemented("Preview");
        },

        Print: function (bPrompt, sOrOFrame, fnNotifyStarted) { // needs and wants update to ES2015 (for default values)
            if (typeof fnNotifyStarted === "undefined") {
                fnNotifyStarted = function (bStarted) { }
            }
            if (typeof (sOrOFrame) === 'undefined') sOrOFrame = null;

            return promptAndPrint(bPrompt,
                function () {
                    if (sOrOFrame != null) {
                        var sFrame = typeof (sOrOFrame) === 'string' ? sOrOFrame : sOrOFrame.id;
                        return printHtml.printFrame(sFrame);
                    }

                    return printHtml.printDocument();
                },
                fnNotifyStarted);
        },

        PrintHTML: function (sUrl, bPrompt, fnNotifyStarted) {
            if (typeof fnNotifyStarted === "undefined") {
                fnNotifyStarted = function (bStarted) { }
            }
            return printHtmlContent(sUrl, bPrompt, fnNotifyStarted);
        },

        PrintHTMLEx: function (sUrl, bPrompt, fnCallback, data, fnNotifyStarted) {
            if (typeof fnNotifyStarted === "undefined") {
                fnNotifyStarted = function (bStarted) { }
            }
            return printHtmlContent(sUrl, bPrompt, fnNotifyStarted, fnCallback, data);
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
            printApi.deviceSettings.paperSourceName = sPaperSource;
        },

        get paperSource2() {
            return printApi.deviceSettings.paperSourceName;
        },

        get pageWidth() {
            return printApi.deviceSettings.paperPageSize.width;
        },

        get pageHeight() {
            return printApi.deviceSettings.paperPageSize.height;
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
            printApi.deviceSettings.duplex = duplex;
        },

        get duplex() {
            return printApi.deviceSettings.duplex;
        },

        set duplex2(duplex) {
            printApi.deviceSettings.duplex = duplex;
        },

        get duplex2() {
            return printApi.deviceSettings.duplex;
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

        get printer() {
            return printApi.printerName;
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
            printApi.deviceSettings.unprintableMargins.left = n;
        },

        get unprintableLeft() {
            return printApi.deviceSettings.unprintableMargins.left;
        },

        set unprintableRight(n) {
            printApi.deviceSettings.unprintableMargins.right = n;
        },

        get unprintableRight() {
            return printApi.deviceSettings.unprintableMargins.right;
        },

        set unprintableTop(n) {
            printApi.deviceSettings.unprintableMargins.top = n;
        },

        get unprintableTop() {
            return printApi.deviceSettings.unprintableMargins.top;
        },

        set unprintableBottom(n) {
            printApi.deviceSettings.unprintableMargins.bottom = n;
        },

        get unprintableBottom() {
            return printApi.deviceSettings.unprintableMargins.bottom;
        },

        // advanced methods :: require a subscription/license.
        EnumPrinters: function (index) {
            var arP = printApi.availablePrinterNames;

            if (!arP || arP.length === 0) {
                if (index === 0) {
                    return this.CurrentPrinter;
                }
            } else {
                if (index < arP.length) {
                    return arP[index];
                }
            }

            return "";
        },

        EnumJobs: function (sPrinterName, iIndex, jobNameOut) {

            var jobs = printApi.queue;
            var i;
            var plist = new Array();

            sPrinterName = sPrinterName.toLowerCase();
            for (i = 0; i < jobs.length; i++) {
                if (jobs[i].printerName.toLowerCase() === sPrinterName) {
                    plist.push(jobs[i]);
                }
            }

            if (iIndex < plist.length) {
                jobNameOut.name = plist[iIndex].jobName;
                return plist[iIndex].status;
            }

            return 0;
        },

        GetJobsCount: function (sPrinterName) {
            // return printApi.activeJobs;
            var jobs = printApi.queue;
            var i;
            var c = 0;

            sPrinterName = sPrinterName.toLowerCase();
            for (i = 0; i < jobs.length; i++) {
                if (jobs[i].printerName.toLowerCase() === sPrinterName)
                    c++;
            }

            return c;
        },

        printerControl: function (printerName) {
            return {
                get Forms() {
                    return printApi.deviceSettingsFor(printerName).forms;
                },

                get Bins() {
                    return printApi.deviceSettingsFor(printerName).bins;
                },

                get forms() {
                    return printApi.deviceSettingsFor(printerName).forms;
                },

                get bins() {
                    return printApi.deviceSettingsFor(printerName).bins;
                },

                get name() {
                    return printerName;
                },

                get port() {
                    return printApi.deviceSettingsFor(printerName).port;
                },
                get attributes() {
                    return printApi.deviceSettingsFor(printerName).attributes;
                },
                get serverName() {
                    return printApi.deviceSettingsFor(printerName).serverName;
                },
                get shareName() {
                    return printApi.deviceSettingsFor(printerName).shareName;
                },
                get location() {
                    return printApi.deviceSettingsFor(printerName).location;
                },
                get isLocal() {
                    return printApi.deviceSettingsFor(printerName).isLocal;
                },
                get isNetwork() {
                    return printApi.deviceSettingsFor(printerName).isNetwork;
                },
                get isShared() {
                    return printApi.deviceSettingsFor(printerName).isShared;
                },

                get Jobs() {
                    printApi.reportFeatureNotImplemented("printerControl.Jobs");
                },
                Purge: function () {
                    printApi.reportFeatureNotImplemented("printerControl.Purge()");
                },
                Pause: function () {
                    printApi.reportFeatureNotImplemented("printerControl.Pause()");
                },
                Resume: function () {
                    printApi.reportFeatureNotImplemented("printerControl.Resume()");
                }
            };
        },

        GetMarginMeasure: function () {
            return settings.page.units === printHtml.PageMarginUnits.INCHES ? 2 : 1;
        },

        SetMarginMeasure: function (enumUnits) {
            settings.page.units = enumUnits === 2 ? printHtml.PageMarginUnits.INCHES : printHtml.PageMarginUnits.MM;
        },

        SetPrintScale: function (value) {
            settings.viewScale = value;
        },

        IsSpooling: function () {
            return printApi.isSpooling();
        },

        OwnQueue: function () {
            // NOTE: No-op, no concept of 'out of process' here
        },

        SetPageRange: function (bSelectionOnly, iFrom, iTo) {
            if (bSelectionOnly) {
                printApi.reportFeatureNotImplemented("SetPageRange selection only");
            }

            settings.pageRange = "" + iFrom + "-" + iTo;
        },

        SetPreviewZoom: function () {
            printApi.reportFeatureNotImplemented("SetPreviewZoom");
        },

        Sleep: function () {
            // If you need this, please implement your own for the browsers you are deploying to 
            // Contact MeadCo for assistance if required.
            printApi.reportFeatureNotImplemented("Sleep");
        },

        TotalPrintPages: function () {
            printApi.reportFeatureNotImplemented("TotalPrintPages");
        },

        WaitForSpoolingComplete: function (iTimeout, fnComplete) {
            printApi.waitForSpoolingComplete(iTimeout, fnComplete);
        },

        enhancedFormatting: iEnhancedFormatting,

        // helpers for wrapper MeadCoJS
        PolyfillInit: function () {
            return MeadCo.ScriptX.Print.isConnected;
        },

        PolyfillInitAsync: function (resolve, reject) {
            if (MeadCo.ScriptX.Print.isConnected) {
                resolve();
            } else {
                printHtml.connectAsync("", "", resolve, reject);
            }
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

    module.factory.log("factory.object loaded.");

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

    module.factory.log("factory.object.js loaded.");

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
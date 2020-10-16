/**
 * MeadCo ScriptX 'window.factory' shim (support for modern browsers and IE 11) JS client library.<br/>
 * 
 * The ScriptX Add-on for Internet Explorer is included on a html document with an &lt;object /&gt; element with a de-facto standard id of 'factory': &lt;object id='factory' /&gt;.
 * 
 * The object is referenced with the property window.factory which exposes properties and methods to define print setting and perform operations such as printing a document or frame.
 * 
 * The object has three further properties:
 * - object
 *   - js
 * - rawPrinting  
 * - printing
 *   - printerControl
 *   - enhancedFormatting
 *
 * This javascript 'module' provides partial emulation of window.factory, window.factory.object and window.factory.object.js
 * 
 * Full emulation (and almost complete implementation) is provided for window.factory.printing, window.factory.printing.printerControl, window.factory.printing.enhancedFormatting. The most notable absent implementation is an implementation of print preview.
 * 
 * Full emulation is provided for window.factory.rawPrinting. Please note that the implementation is synchronous and browsers will issue a warning to the console.
 * 
 * ScriptX Add-on for Internet Explorer intercepts the browser UI for printing. For obvious reasons this is not possible with javascript, however ::
 * 
 * <strong>PLEASE NOTE:</strong> This library replaces window.print()
 * 
 * Full documentation on the properties/methods is provided by the {@link https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn|technical reference documentation} for the ScriptX Add-on for Internet Explorer. That documentation is not reproduced here.
 * 
 * If the startup script determines that the ScriptX Add.on for IE is already active then it will quietly give priority to the object. In other words, the Add-on has precedence on Internet Explorer.
 * 
 * This enables the same experience (almost) to be delivered to any browser on any device with the same html/javascript code.
 * 
 * It is strongly recommended that the [MeadCoScriptJS library]{@link https://github.com/MeadCo/MeadCoScriptXJS} is used in conjunction with this library as it provides code (Promises) to assist
 * with working with the significant difference between the synchronous nature of the functions of ScriptX.Add-on (which hide the underlying asynchrony) and the asynchronous nature of javascript AJAX processing.
 * 
 * Requires:
 * - MeadCo.Core
 * - MeadCo.ScriptX.Print
 * - MeadCo.ScriptX.Print.HTML
 *
 * - MeadCo.ScriptX.Print.Licensing when using ScritpX.Services for Windows PC
 *      
 * MeadCo.ScriptX.Print.HTML.connect[Async]() or MeadCo.ScriptX.Print.connect[Async]() *MUST* be called before using the apis in this library.
 * 
 * See [ScriptX Samples]{@link https://scriptxprintsamples.meadroid.com} for a lot of samples on using this code.
 * 
 * Some Add-on APIs lead to system provided dialogs (e.g. printer and paper setup) - support for implementing the dialogs in javascript as simple plug-ins is provided, along with an example implementation using bootstrap/jQuery (see jQuery-MeadCo.ScriptX.Print.UI.js)
 *
 * @example
 * MeadCo.ScriptX.Print.UI = {
 *    PageSetup: function(fnDialgCompleteCallBack) { ... dialog code ...},
 *    PrinterSettings: function(fnDialgCompleteCallBack) { ... dialog code ...}
 * }
 * 
 * @namespace factory
 */

// we anti-polyfill &lt;object id="factory" /&gt;
// enabling old code to run in modern browsers
//
// static singleton instances.
//
; (function (name, definition, undefined) {

    if (this[name] !== undefined || document.getElementById(name) !== null) {
        MeadCo.log("ScriptX.Services ScriptX.factory emulation believes it may not be requred.");
        if (this[name] !== undefined) {
            MeadCo.log("this[" + name + "] is defined");
        }
        if (document.getElementById(name) !== null) {
            MeadCo.log("document.getElementById(" + name + ") is defined");
        }
        if (this[name].object !== undefined) {
            MeadCo.log("this[" + name + "].object is defined -- not required!!!");
            return;
        } else {
            MeadCo.log("this[" + name + "].object is *not* defined");
        }
    }

    MeadCo.log("ScriptX.Services ScriptX.factory emulation believes it is requred.");
    var theModule = definition();

    // Assign to the global object (window)
    (this)[name] = theModule;

})('factory', function () {
    // If this is executing, we believe we are needed.
    // protected API
    var moduleversion = "1.7.0.8";
    var emulatedVersion = "8.3.0.0";
    var servicesVersion = "";
    var printApi = MeadCo.ScriptX.Print;
    var logApi = MeadCo; // could be console

    var module = this;

    function log(str) {
        logApi.log("factory emulation :: " + str);
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

    };

    log("'factory' loaded " + moduleversion);

    // public API.
    return {
        log: log,

        // 'factory' functions

        /* GetComponentVersion is no longer documented . It is implemented as MeadCoScriptJS relies on it.
         * 
         * We support ScriptX ProgIds and progid style names for scriptx services.
         */
        GetComponentVersion: function (sComponent, a, b, c, d) {
            log("factory.object.getcomponentversion: " + sComponent);
            var v = moduleversion;

            switch (sComponent.toLowerCase()) {
                case "scriptx.factory":
                    v = emulatedVersion;
                    break;

                case "scriptx.factory.services":
                    v = moduleversion;
                    break;

                case "scriptx.services":
                    if (servicesVersion === "") {
                        if (typeof printApi !== "undefined") {
                            var ea = printApi.onErrorAction;

                            printApi.onErrorAction = printApi.ErrorAction.THROW;

                            try {
                                var sd = printApi.serviceDescription();
                                if (sd !== null) {
                                    var sv = sd.serviceVersion;
                                    servicesVersion = sv.major + "." + sv.minor + "." + sv.build + "." + sv.revision;
                                }
                            } catch (e) { servicesVersion = moduleversion; }

                            printApi.onErrorAction = ea;
                        }
                    }
                    v = servicesVersion;
                    break;

                case "meadco.secmgr":
                    try {
                        v = module.secmgr.version;
                    } catch (e) { v = "0.0.0.0"; }
                    break;

                case "meadco.triprint":
                    try {
                        v = MeadCo.ScriptX.Print.HTML.version;
                    } catch (e) { v = "0.0.0.0"; }
                    break;
            }

            v = v.split(".");
            a[0] = v[0];
            b[0] = v[1];
            c[0] = v[2];
            d[0] = v[3];
        },

        /*
         * Only ScriptX related ProgIds are supported.
         *
         */
        ComponentVersionString: function (sProgId) {
            var a = new Object();
            var b = new Object();
            var c = new Object();
            var d = new Object();

            module.factory.GetComponentVersion(sProgId, a, b, c, d);
            return a[0] + "." + b[0] + "." + c[0] + "." + d[0];
        },

        get ScriptXVersion() { return emulatedVersion; },
        get SecurityManagerVersion() { return emulatedVersion; },

        /*
         * Unique IDs are not suported in services
         */
        IsUniqueIDAvailable: function (bForMachine) { return false; },
        UniqueID: function (bForMachine) { return 0; },
        ResetUniqueID: function (bForMachine) { return 0; },

        baseURL: function (sUrl) {
            var link = document.createElement("a");
            link.href = sUrl;
            return link.href;
        },

        relativeURL: function (sUrl) {
            throw "MeadCo.ScriptX.Print :: relativeUrl is not implemented.\n\nPlease see https://github.com/medialize/URI.js for an alternative.";
        },

        OnDocumentComplete: function (frameOrWindow, callback) {
            // other windows is an anachronism we dont support, this window is, by 
            // definition, complete
            if (typeof frameOrWindow.contentWindow === "undefined") {
                callback();
            }
            else {
                // a frame .. listen for load 
                frameOrWindow.addEventListener("load", function (e) {
                    callback();
                }, { once: true });
            }
        },

        get rawPrinting() {
            var sPrinterName = "";
            var printApi = MeadCo.ScriptX.Print;

            function printDirect(eContentType, sContent) {

                var bPrinted = false;

                if (typeof printApi !== "undefined") {

                    var p = factory.printing.printer;

                    factory.printing.printer = sPrinterName;

                    if (eContentType === printApi.ContentType.URL) {
                        sContent = module.factory.baseURL(sContent);
                    }

                    bPrinted = printApi.printDirect(eContentType, sContent);

                    factory.printing.printer = p;
                }

                return bPrinted;
            }

            return {

                get printer() { return sPrinterName; },
                set printer(printerName) {
                    var p = factory.printing.printer;
                    factory.printing.printer = printerName;
                    if (factory.printing.printer !== printerName) {
                        throw "Unknown printer";
                    }
                    factory.printing.printer = p;
                    sPrinterName = printerName;
                },

                printString: function (s) {
                    return typeof printApi !== "undefined" ? printDirect(printApi.ContentType.STRING, s) : false;
                },

                printDocument: function (sUrl) {
                    return typeof printApi !== "undefined" ? printDirect(printApi.ContentType.URL, sUrl) : false;
                }
            };
        },


        /*
         * A no op for services 
         */
        Shutdown: function () {
            return null;
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
    var printPdf = MeadCo.ScriptX.Print.PDF;
    var settings = printHtml.settings;
    var printApi = MeadCo.ScriptX.Print;

    var module = this;

    module.factory.log("factory.Printing loaded.");

    function promptAndPrint(bPrompt, fnPrint, fnNotifyStarted) {
        if (typeof (bPrompt) === 'undefined') bPrompt = true;
        var lock = printApi.ensureSpoolingStatus();
        var bStarted = false;
        var err = null;

        if (bPrompt) {
            if (MeadCo.ScriptX.Print.UI) {
                MeadCo.ScriptX.Print.UI.PrinterSettings(function (dlgAccepted) {
                    if (dlgAccepted) {
                        MeadCo.log("promptAndPrint requesting print ...");
                        try {
                            bStarted = fnPrint();
                            fnNotifyStarted(bStarted);
                        }
                        catch (e) {
                            err = e;
                        }
                    }
                    else
                        fnNotifyStarted(false);

                    printApi.freeSpoolStatus(lock);
                });

                if (err !== null) {
                    throw err;
                }

                MeadCo.log("promptAndPrint exits ...");
                return bStarted;
            }
            MeadCo.warn("prompted print requested but no UI library loaded. See: https://www.meadroid.com/Developers/KnowledgeBank/Articles/Dialogs");
        }

        try {
            bStarted = fnPrint();
            fnNotifyStarted(bStarted);
        }
        catch (e) {
            err = e;
        }
        finally {
            printApi.freeSpoolStatus(lock);
        }

        if (err !== null)
            throw err;

        return bStarted;
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
            sUrl = module.factory.baseURL(sUrl);
        }

        return promptAndPrint(bPrompt,
            function () {
                MeadCo.log("printHtmlContent requesting print ...");
                return sHtml.length > 0 ? printHtml.printHtml(sHtml, null, fnCallback, data) : printHtml.printFromUrl(sUrl, null, fnCallback, data);
            }, fnNotifyStarted);
    }

    function printPdfContent(sUrl, bPrompt, fnNotifyStarted, fnCallback, data) {
        // if a relative URL supplied then add the base URL of this website
        if (typeof printPdf !== "undefined") {
            sUrl = module.factory.baseURL(sUrl);

            return promptAndPrint(bPrompt,
                function () {
                    MeadCo.log("printPdfContent requesting print ...");
                    return printPdf.print(sUrl, null, fnCallback, data);
                },
                fnNotifyStarted);
        }

        MeadCo.error("MeadCo.ScriptX.Print.PDF is not available to ScriptX.Services factory emulation.");
        fnNotifyStarted(false);
        return false;
    }

    if (typeof module.print === "function") {
        module.factory.log("overwriting module.print");
        module.print = function () {
            module.factory.log("window.print() called and being handled.");
            promptAndPrint(
                true,
                function () {
                    return printHtml.printDocument();
                },
                function () { });
        };
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
            if (typeof printPdf !== "undefined") {
                printPdf.settings.pageRange = v;
            }
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
        },

        get pdfPrintMode() {
            return typeof printPdf !== "undefined" ? printPdf.settings.printQuality : 0;
        },
        set pdfPrintMode(v) {
            if (typeof printPdf !== "undefined") {
                printPdf.settings.printQuality = v;
            }
        }

    };

    if (typeof printApi !== "undefined") {
        printApi.useAttributes();

        // ScriptX.Addon printing intercepts Ctrl-p ...
        // listen for Ctrl-P and override ...
        document.addEventListener("keydown", function (e) {
            if (e.ctrlKey && e.keyCode == 80 && !e.shiftKey) {
                e.preventDefault();
                module.factory.log("ctrl-p being handled.");
                promptAndPrint(
                    true,
                    function () {
                        return printHtml.printDocument();
                    },
                    function () { });
            }
        });
    }
    else {
        MeadCo.error("MeadCo.ScriptX.Print is not available to ScriptX.Services factory emulation.");
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
        // enable alternative server behaviour. Doing something
        // is required by the minimiser or it optimises to bad code
        set templateURL(sUrl) {
            var x = sUrl;
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
            if (typeof fnNotify !== "function") {
                MeadCo.warn("PageSetup API in ScriptX.Print Service is not synchronous, there is no return value.");
                fnNotify = function (bDlgOK) { MeadCo.log("PageSetupDlg: " + bDlgOK); };
            }

            if (MeadCo.ScriptX.Print.UI) {
                MeadCo.ScriptX.Print.UI.PageSetup(fnNotify);
            } else {
                MeadCo.error("PageSetup dialog in ScriptX.Services needs a dialog implementation. See: https://www.meadroid.com/Developers/KnowledgeBank/Articles/Dialogs");
                fnNotify(false);
            }
        },

        PrintSetup: function (fnNotify) {
            if (typeof fnNotify !== "function") {
                MeadCo.warn("PrintSetup API in ScriptX.Print Service is not synchronous, there is no return value.");
                fnNotify = function (bDlgOK) { MeadCo.log("PrintSetupDlg: " + bDlgOK); }
            }

            if (MeadCo.ScriptX.Print.UI) {
                MeadCo.ScriptX.Print.UI.PrinterSettings(fnNotify);
            } else {
                MeadCo.error("PrintSettings dialog in ScriptX.Services needs a dialog implementation. See: https://www.meadroid.com/Developers/KnowledgeBank/Articles/Dialogs");
                fnNotify(false);
            }
        },

        Preview: function (sOrOFrame) {
            printApi.reportFeatureNotImplemented("Preview", sOrOFrame);
        },

        Print: function (bPrompt, sOrOFrame, fnNotifyStarted) { // needs and wants update to ES2015 (for default values)
            if ( !fnNotifyStarted ) {
                fnNotifyStarted = function (bStarted) { MeadCo.log("A print has started"); };
            }
            if (!sOrOFrame) {
                sOrOFrame = null;
            }
            else {
                // passing in window, or window.self etc will not have an id .. don't barf on that code
                if (typeof (sOrOFrame) === 'object' && !sOrOFrame.id) {
                    sOrOFrame = null;
                }
            }

            return promptAndPrint(bPrompt,
                function () {
                    if (sOrOFrame !== null) {
                        var sFrame = typeof (sOrOFrame) === 'string' ? sOrOFrame : sOrOFrame.id;
                        return printHtml.printFrame(sFrame);
                    }

                    return printHtml.printDocument();
                },
                fnNotifyStarted);
        },

        PrintHTML: function (sUrl, bPrompt, fnNotifyStarted) {
            if (typeof fnNotifyStarted === "undefined") {
                fnNotifyStarted = function (bStarted) { };
            }
            return printHtmlContent(sUrl, bPrompt, fnNotifyStarted);
        },

        PrintHTMLEx: function (sUrl, bPrompt, fnCallback, data, fnNotifyStarted) {
            if (typeof fnNotifyStarted === "undefined") {
                fnNotifyStarted = function (bStarted) { };
            }
            return printHtmlContent(sUrl, bPrompt, fnNotifyStarted, fnCallback, data);
        },

        PrintPDF: function (options, bPrompt, bShrinkToFit, iPageFrom, iPageTo, fnNotifyStarted) {
            if (typeof fnNotifyStarted === "undefined") {
                fnNotifyStarted = function (bStarted) { };
            }

            if (typeof printPdf !== "undefined") {

                printPdf.resetSettings();

                if (typeof options.pagescaling !== "undefined") {
                    printPdf.settings.pageScaling = options.pagescaling;
                } else {
                    printPdf.settings.pageScaling = bShrinkToFit
                        ? printPdf.PdfPageScaling.SHRINKLARGEPAGES
                        : printPdf.PdfPageScaling.UNDEFINED;
                }

                if (typeof options.autorotatecenter !== "undefined") {
                    printPdf.settings.autoRotateCenter = options.autorotatecenter
                        ? printPdf.BooleanOption.TRUE
                        : printPdf.BooleanOption.FALSE;
                } else
                    printPdf.settings.autoRotateCenter = printPdf.BooleanOption.DEFAULT;

                if (typeof options.orientation !== "undefined") {
                    printPdf.settings.orientation = options.orientation === 1
                        ? printPdf.PageOrientation.PORTRAIT
                        : printPdf.PageOrientation.LANDSCAPE;
                } else
                    printPdf.settings.orientation = this.portrait
                        ? printPdf.PageOrientation.PORTRAIT
                        : printPdf.PageOrientation.LANDSCAPE;

                if (typeof options.pages !== "undefined") {
                    printPdf.settings.pageRange = options.pages;
                } else {
                    if (typeof iPageFrom !== "undefined" &&
                        typeof iPageTo !== "undefined" &&
                        iPageFrom !== -1 &&
                        iPageTo !== -1) {
                        printPdf.settings.pageRange = iPageFrom + "-" + iPageTo;
                    } else {
                        printPdf.settings.pageRange = "";
                    }
                }

                if (typeof options.monochrome !== "undefined") {
                    printPdf.settings.monochrome = options.monochrome
                        ? printPdf.BooleanOption.TRUE
                        : printPdf.BooleanOption.FALSE;
                } else
                    printPdf.settings.monochrome = printPdf.BooleanOption.DEFAULT;

                if (typeof options.normalise !== "undefined" || typeof options.normalize !== "undefined") {
                    printPdf.settings.normalise = options.normalise || options.normalize
                        ? printPdf.BooleanOption.TRUE
                        : printPdf.BooleanOption.FALSE;
                } else
                    printPdf.settings.normalise = printPdf.BooleanOption.DEFAULT;

                if (typeof options.printMode !== "undefined") {
                    printPdf.settings.printQuality = options.printMode;
                } else {
                    if (typeof options.printQuality !== "undefined") {
                        printPdf.settings.printQuality = options.printQuality;
                    }
                }

                if (typeof options.jobname !== "undefined") {
                    printPdf.settings.jobDescription = options.jobname;
                }

                if (typeof options.jobName !== "undefined") {
                    printPdf.settings.jobDescription = options.jobName;
                }

                return printPdfContent(options.url, bPrompt, fnNotifyStarted);
            }
            MeadCo.error("MeadCo.ScriptX.Print.PDF is not available to ScriptX.Services factory emulation.");
            fnNotifyStarted(false);
            return false;
        },

        BatchPrintPDF: function (sUrl, fnNotifyStarted) {
            this.BatchPrintPDFEx(sUrl, function () {

            }, "BatchPrintPDF", fnNotifyStarted);
        },

        BatchPrintPDFEx: function (sUrl, fnCallback, data, fnNotifyStarted) {
            if (typeof fnNotifyStarted === "undefined") {
                fnNotifyStarted = function (bStarted) { };
            }

            if (typeof printPdf !== "undefined") {
                printPdf.resetSettings();

                printPdf.settings.pageRange = iEnhancedFormatting.pageRange;
                printPdf.settings.pageScaling = settings.viewScale === -1
                    ? printPdf.PdfPageScaling.SHRINKLARGEPAGES
                    : printPdf.PdfPageScaling.UNDEFINED;
                printPdf.settings.orientation = this.portrait
                    ? printPdf.PageOrientation.PORTRAIT
                    : printPdf.PageOrientation.LANDSCAPE;
                printPdf.settings.printQuality = iEnhancedFormatting.pdfPrintMode;

                printPdfContent(sUrl, false, fnNotifyStarted, fnCallback, data);
                return;
            }

            MeadCo.error("MeadCo.ScriptX.Print.PDF is not available to ScriptX.Services factory emulation.");
            fnNotifyStarted(false);
        },

        set units(enumUnits) {
            this.SetMarginMeasure(enumUnits);
        },

        get units() {
            return this.GetMarginMeasure();
        },

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
            printApi.deviceSettings.collate = (bCollate === true || bCollate === 1) ? printApi.CollateOptions.TRUE : printApi.CollateOptions.FALSE;
        },

        get collate() {
            return printApi.deviceSettings.collate === printApi.CollateOptions.TRUE;
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
            printApi.reportFeatureNotImplemented("onbeforeprint", fn);
        },

        set onafterprint(fn) {
            printApi.reportFeatureNotImplemented("onafterprint", fn);
        },

        set onuserprintpreview(fn) {
            printApi.reportFeatureNotImplemented("onuserprintpreview", fn);
        },

        DefaultPrinter: function () {
            var i = 0;
            var printerName = this.printer;

            // optimise that the current printer is the default (often will be)
            if (printerName !== "" && printApi.deviceSettingsFor(printerName).isDefault) {
                return printerName;
            }
            else {
                while ((printerName = this.EnumPrinters(i++)) !== "") {
                    if (printApi.deviceSettingsFor(printerName).isDefault) {
                        return printerName;
                    }
                }
            }
            return "";
        },

        // duplicate to cope with COM objects were/are not case sensitive
        get CurrentPrinter() {
            return printApi.printerName;
        },

        set CurrentPrinter(sPrinterName) {
            this.currentPrinter = sPrinterName;
        },

        get currentPrinter() {
            return printApi.printerName;
        },

        set currentPrinter(sPrinterName) {
            if (typeof sPrinterName === "string") {
                var a = printApi.onErrorAction;

                printApi.onErrorAction = printApi.ErrorAction.THROW;

                try {
                    printApi.printerName = sPrinterName;
                    printApi.onErrorAction = a;
                } catch (e) {
                    printApi.onErrorAction = a;
                    throw e;
                }
            }
        },

        get printer() {
            return printApi.printerName;
        },

        set printer(sPrinterName) {
            if (typeof sPrinterName === "string") {

                var a = printApi.onErrorAction;

                printApi.onErrorAction = printApi.ErrorAction.THROW;

                // eat all and any errors. finally might be better but
                // minifiers dont like empty blocks 
                try {
                    printApi.printerName = sPrinterName;
                    printApi.onErrorAction = a;
                }
                catch (e) {
                    printApi.onErrorAction = a;
                }
            }
        },

        set printToFileName(sFileName) {
            printApi.deviceSettings.printToFileName = sFileName;
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

                get status() {
                    return printApi.deviceSettingsFor(printerName).port;
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
            return settings.page.units === printApi.MeasurementUnits.INCHES ? 2 : 1;
        },

        SetMarginMeasure: function (enumUnits) {
            settings.page.units = enumUnits === 2 ? printApi.MeasurementUnits.INCHES : printApi.MeasurementUnits.MM;
        },

        SetPrintScale: function (value) {
            settings.viewScale = value;
        },

        IsSpooling: function () {
            return printApi.isSpooling;
        },

        OwnQueue: function () {
            // NOTE: No-op, no concept of 'out of process' here
            return null;
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
            // If you need this, please implement your own for the browsers you are deploying to. 
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
            if (!MeadCo.ScriptX.Print.isConnected) {
                printHtml.connect("", "", function (e) {
                    MeadCo.warn("Services server connection failed: " + e);
                });
            }
            return MeadCo.ScriptX.Print.isConnected;
        },

        PolyfillInitAsync: function (resolve, reject) {
            if (MeadCo.ScriptX.Print.isConnected) {
                resolve(2);
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

    /*
     * This completes the emulation of an &lt;object /&gt; element
     *
     * Compatibility with Add-on to allow inspection of  &lt;object /&gt; and this javascript
     * for the underlying object implementing 'factory'.
     * 
     * @property {object} factory
     * @memberof factoryobject
     */
    return module.factory;
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
        /*
         * Convert object to number -- required for some code compatibility only. Do not use
         * 
         * @function FormatNumber
         * @memberof factoryjs
         * @param {any} arg object to convert
         * @returns {Number} arg as a number if it can be converted, else 0 
         */
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

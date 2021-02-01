/**
 * MeadCo.ScriptX.Print.HTML
 *
 * A static class providing printing of HTML content.
 * 
 * Requires: meadco-core.js, meadco-scriptxprint.js
 *
 * The purpose of these libraries is to assist those with a body of client javascript code targetting use of the ScriptX Add-On for Internet Explorer. These libraries assist with continuing with a large part of the code
 * intact when transitioning to using ScriptX.Services instead/as well.
 * 
 * Includes processing of calls to the print api that return "printing to file" including collecting the
 * file output.
 *
 * @namespace MeadCoScriptXPrintHTML
 *
 */

; (function (name, definition) {
    extendMeadCoNamespace(name, definition);
})('MeadCo.ScriptX.Print.HTML', function () {

    var moduleversion = "1.8.0.0";

    /**
     * Enum to describe the units used on measurements - **NOTE** please use MeadCo.ScriptX.Print.MeasurementUnits instead
     *
     * @memberof MeadCoScriptXPrintHTML
     * @typedef {number} PageMarginUnits
     * @deprecated
     * @enum {PageMarginUnits}
     * @readonly
     * @property {number} DEFAULT 0 use the default at the print server
     * @property {number} INCHES 1 
     * @property {number} MM 2 millimeters
     */
    var mPageMarginUnits = {
        DEFAULT: 0,
        INCHES: 1,
        MM: 2
    };

    /**
     * Enum to describe the orientation of the paper
     *
     * @memberof MeadCoScriptXPrintHTML    
     * @typedef {number} PageOrientation
     * @enum {PageOrientation}
     * @readonly
     * @property {number} DEFAULT 0 use the default at the print server
     * @property {number} LANDSCAPE 1 
     * @property {number} PORTRAIT 2 
     */
    var mPageOrientation = {
        DEFAULT: 0,
        LANDSCAPE: 1,
        PORTRAIT: 2
    };

    /**
     * Enum to describe the pages to be printed
     *
     * @memberof MeadCoScriptXPrintHTML    
     * @typedef {number} PrintingPass
     * @enum {PrintingPass}
     * @readonly
     * @property {number} ALL 1 print all pages
     * @property {number} ODD 2 print odd numbered pages only 
     * @property {number} EVEN 3 print even numbered pages only 
     */
    var mPrintingPass = {
        ALL: 1,
        ODD: 2,
        EVEN: 3
    };

    /**
     * Enum to describe a boolean value or use the default 
     *
     * @memberof MeadCoScriptXPrintHTML
     * @typedef {number} BooleanOption
     * @enum {BooleanOption}
     * @readonly
     * @property {number} DEFAULT 0 use the default at the print server
     * @property {number} TRUE 1 
     * @property {number} FALSE 2 
     */
    var BooleanOption = {
        DEFAULT: 0,
        TRUE: 1,
        FALSE: 2
    };

    /**
     * @typedef Margins
     * @memberof MeadCoScriptXPrintHTML
     * @property {number} left left margin in requested units
     * @property {number} top top margin in requested units
     * @property {number} right right margin in requested units
     * @property {number} bottom bottom margin in requested units
     * */
    var Margins;  // for doc generator

    /**
     * @typedef PageSettings
     * @memberof MeadCoScriptXPrintHTML
     * @property {PageOrientation} orientation orientation of the paper (size and source is a device setting)
     * @property {MeasurementUnits} units measurement units for margins
     * @property {Margins} margins margins to use
     * */
    var PageSettings;  // for doc generator

    /**
     * @typedef ExtraHeaderAndFooterSettings
     * @memberof MeadCoScriptXPrintHTML
     * @property {string} allPagesHeader
     * @property {string} allPagesFooter
     * @property {string} firstPageHeader
     * @property {string} firstPageFooter
     * @property {string} extraFirstPageFooter
     * @property {number} allHeaderHeight
     * @property {number} allFooterHeight
     * @property {number} firstHeaderHeight
     * @property {number} firstFooterHeight
     * @property {number} extraFirstFooterHeight
     * */
    var ExtraHeaderAndFooterSettings;  // for doc generator

    var settingsCache =
    {
        header: null,
        footer: null,
        headerFooterFont: null,
        viewScale: 0,
        locale: (navigator.languages && navigator.languages.length)
            ? navigator.languages[0]
            : navigator.language,
        timezoneOffset: 0,
        shortDateFormat: "",
        longDateFormat: "",
        printBackgroundColorsAndImages: false,
        page: {
            orientation: mPageOrientation.PORTRAIT,
            units: MeadCo.ScriptX.Print.MeasurementUnits.DEFAULT,
            margins: {
                left: "",
                top: "",
                bottom: "",
                right: ""
            }
        },
        extraHeadersAndFooters: {
        },
        pageRange: "",
        printingPass: mPrintingPass.ALL,
        jobTitle: "",
        documentUrl: document.URL
    };

    var iSettings =
    {
        set header(str) {
            MeadCo.log("MeadCo.ScriptX.Print.HTML setting header: " + str);
            if (str && str.length === 0) {
                str = "%20";
            }
            settingsCache.header = str;
        },
        get header() {
            return ( !settingsCache.header || settingsCache.header === "%20") ? "" : settingsCache.header;
        },

        set footer(str) {
            if (str && str.length === 0) {
                str = "%20";
            }
            settingsCache.footer = str;
        },

        get footer() {
            return ( !settingsCache.footer || settingsCache.footer === "%20") ? "" : settingsCache.footer;
        },

        set headerFooterFont(str) {
            if (str && str.length === 0) {
                str = "%20";
            }
            settingsCache.headerFooterFont = str;
        },

        get headerFooterFont() {
            return ( !settingsCache.headerFooterFont || settingsCache.headerFooterFont === "%20") ? "" : settingsCache.headerFooterFont;
        },

        get locale() {
            return settingsCache.locale;
        },

        set viewScale(x) {
            settingsCache.viewScale = x;
        },

        get viewScale() {
            return settingsCache.viewScale;
        },

        set locale(x) {
            settingsCache.locale = x;
        },

        set shortDateFormat(x) {
            settingsCache.shortDateFormat = x;
        },

        set longDateFormat(x) {
            settingsCache.longDateFormat = x;
        },

        set printBackgroundColorsAndImages(b) {
            settingsCache.printBackgroundColorsAndImages = b ? BooleanOption.TRUE : BooleanOption.FALSE;
        },

        get printBackgroundColorsAndImages() {
            return settingsCache.printBackgroundColorsAndImages === BooleanOption.TRUE;
        },

        extraHeadersAndFooters: {
            get allPagesHeader() {
                return settingsCache.extraHeadersAndFooters.allPagesHeader;
            },
            set allPagesHeader(v) {
                settingsCache.extraHeadersAndFooters.allPagesHeader = v;
            },

            get allPagesFooter() {
                return settingsCache.extraHeadersAndFooters.allPagesFooter;
            },
            set allPagesFooter(v) {
                settingsCache.extraHeadersAndFooters.allPagesFooter = v;
            },

            get firstPageHeader() {
                return settingsCache.extraHeadersAndFooters.firstPageHeader;
            },
            set firstPageHeader(v) {
                settingsCache.extraHeadersAndFooters.firstPageHeader = v;
            },

            get firstPageFooter() {
                return settingsCache.extraHeadersAndFooters.firstPageFooter;
            },
            set firstPageFooter(v) {
                settingsCache.extraHeadersAndFooters.firstPageFooter = v;
            },

            get extraFirstPageFooter() {
                return settingsCache.extraHeadersAndFooters.extraFirstPageFooter;
            },
            set extraFirstPageFooter(v) {
                settingsCache.extraHeadersAndFooters.extraFirstPageFooter = v;
            },

            get allHeaderHeight() {
                return settingsCache.extraHeadersAndFooters.allHeaderHeight;
            },
            set allHeaderHeight(v) {
                if (typeof v !== "number") {
                    throw "Invalid argument";
                }
                settingsCache.extraHeadersAndFooters.allHeaderHeight = v;
            },

            get allFooterHeight() {
                return settingsCache.extraHeadersAndFooters.allFooterHeight;
            },
            set allFooterHeight(v) {
                if (typeof v !== "number") {
                    throw "Invalid argument";
                }
                settingsCache.extraHeadersAndFooters.allFooterHeight = v;
            },

            get firstHeaderHeight() {
                return settingsCache.extraHeadersAndFooters.firstHeaderHeight;
            },
            set firstHeaderHeight(v) {
                if (typeof v !== "number") {
                    throw "Invalid argument";
                }
                settingsCache.extraHeadersAndFooters.firstHeaderHeight = v;
            },

            get firstFooterHeight() {
                return settingsCache.extraHeadersAndFooters.firstFooterHeight;
            },
            set firstFooterHeight(v) {
                if (typeof v !== "number") {
                    throw "Invalid argument";
                }
                settingsCache.extraHeadersAndFooters.firstFooterHeight = v;
            },

            get extraFirstFooterHeight() {
                return settingsCache.extraHeadersAndFooters.extraFirstFooterHeight;
            },
            set extraFirstFooterHeight(v) {
                if (typeof v !== "number") {
                    throw "Invalid argument";
                }
                settingsCache.extraHeadersAndFooters.extraFirstFooterHeight = v;
            }
        },

        page: {
            set orientation(enumOrientation) {
                settingsCache.page.orientation = enumOrientation;
            },

            get orientation() {
                return settingsCache.page.orientation;
            },

            set units(enumUnits) {
                settingsCache.page.units = enumUnits;
            },

            get units() {
                return settingsCache.page.units;
            },

            margins: {
                set left(n) {
                    settingsCache.page.margins.left = n;
                },

                get left() {
                    return settingsCache.page.margins.left;
                },

                set top(n) {
                    settingsCache.page.margins.top = n;
                },

                get top() {
                    return settingsCache.page.margins.top;
                },

                set bottom(n) {
                    settingsCache.page.margins.bottom = n;
                },

                get bottom() {
                    return settingsCache.page.margins.bottom;
                },

                set right(n) {
                    settingsCache.page.margins.right = n;
                },

                get right() {
                    return settingsCache.page.margins.right;
                }

            }
        },

        get pageRange() { return settingsCache.pageRange; },
        set pageRange(v) { settingsCache.pageRange = v; },

        get printingPass() { return settingsCache.printingPass; },
        set printingPass(v) {
            if (typeof v === "number" && v >= mPrintingPass.ALL && v <= mPrintingPass.ODDANDEVEN) {
                settingsCache.printingPass = v;
                return;
            }
            throw "Invalid argument";
        }

    };

    function updateSettingsWithServerDefaults(sDefaults) {
        if (sDefaults !== null) {
            settingsCache = sDefaults;
            settingsCache.locale = (navigator.languages && navigator.languages.length)
                ? navigator.languages[0]
                : navigator.language;
            settingsCache.timezoneOffset = (new Date()).getTimezoneOffset();
            settingsCache.documentUrl = document.URL;
            MeadCo.log("Settings cache updated, .locale: [" + settingsCache.locale + "], .offset: " + settingsCache.timezoneOffset);
            return true;
        }
        else {
            MeadCo.warn("Igoring attempt to updateSettingsWithServerDefaults with null");
            return false;
        }
    }

    function persistData($element) {
        // preserve all form values.
        // Radiobuttons and checkboxes
        jQuery(":checked", $element).each(function () {
            this.setAttribute('checked', 'checked');
        });

        // simple text inputs - including html 5 types
        var types = 'text search number email datetime datetime-local date month week time tel url color range'.split(' '),
            len = types.length;

        for (var i = 0; i < len; i++) {
            jQuery("input[type=" + types[i] + "]", $element).each(function () {
                this.setAttribute('value', jQuery(this).val());
            });
        }

        jQuery("select", $element).each(function () {
            var $select = jQuery(this);
            jQuery("option", $select).each(function () {
                if ($select.val() === jQuery(this).val())
                    this.setAttribute('selected', 'selected');
            });
        });

        jQuery("textarea", $element).each(function () {
            this.innerHTML = jQuery(this).val();
        });
    }

    function getBaseHref() {
        var port = (window.location.port) ? ':' + window.location.port : '';
        return window.location.protocol + '//' + window.location.hostname + port + window.location.pathname;
    }

    function printableHtmlDocument($htmlDoc) {

        persistData($htmlDoc);

        var $html = $htmlDoc.clone();

        jQuery("script", $html).remove();
        jQuery("object", $html).remove();

        if (!jQuery("head>base", $html).length) {
            MeadCo.log("No base element, fabricating one to: " + getBaseHref());
            var base = jQuery("<base>",
                {
                    href: getBaseHref()
                });
            jQuery("head", $html).prepend(base);
        }

        return $html.html();
    }

    function documentHtml() {
        return printableHtmlDocument(jQuery("html"));
    }

    function documentContent() {
        if (this.jQuery) {
            return documentHtml();
        }

        throw new Error("No supported html snapshot helper available (jQuery is required)");
    }

    function frameContent(sFrame) {
        if (this.jQuery) {
            var $frame = jQuery("#" + sFrame);

            if (!$frame.length) {
                $frame = jQuery('iframe[name=' + sFrame + ']');
                if (!$frame.length) {
                    throw new Error("Unable to get frame content - frame does not exist");
                }
            }

            return printableHtmlDocument($frame.contents().find("html"));
        }

        throw new Error("No supported framed html snapshot helper available (jQuery is required)");

    }

    function printHtmlAtServer(contentType, content, title, fnDone, fnCallback, data) {
        var htmlPrintSettings = settingsCache;
        htmlPrintSettings.jobTitle = title;
        return MeadCo.ScriptX.Print.printHtml(contentType, content, htmlPrintSettings, fnDone, fnCallback, data);
    }

    MeadCo.log("MeadCo.ScriptX.Print.HTML " + moduleversion + " loaded.");

    if (!this.jQuery) {
        MeadCo.log("**** warning :: no jQuery");
    }

    // public API
    return {
        PageMarginUnits: mPageMarginUnits,
        PageOrientation: mPageOrientation,
        PrintingPasses: mPrintingPass,

        /**
         * The soft settings to use when printing html content - headers, footers and margins
         * (Device settings such as papersize, printer are described with MeadCo.ScriptX.Print.deviceSettings)
         *  
         * @memberof MeadCoScriptXPrintHTML    
         * @typedef Settings
         * @property {string} header Page header for all pages.
         * @property {string} footer Page footer for all pages.
         * @property {string} headerFooterFont description of font to use for header/footer
         * @property {number} viewScale the scaling to use when printing expressed as a percentage. -1 => scale to fit
         * @property {string} locale language/locale - used for formatting date/time values in header/footer. defaults to client browser setting
         * @property {number} timezoneOffset client browser timezone offset so server will print correct time
         * @property {string} shortDateFormat formating string for short dates, if not provided then uses the locale default, or the server default
         * @property {string} longDateFormat formating string for long dates, if not provided then uses the locale default, or the server default
         * @property {BooleanOption} printBackgroundColorsAndImages True if background colours and images are to be printed.
         * @property {PageSettings} page orientation and margins to use on the paper
         * @property {ExtraHeaderAndFooterSettings} extraHeadersAndFooters enhanced headers and footers
         * @property {string} pageRange the (set of) page ranges to print, if empty, print all.
         * @property {PrintingPass} printingPass print all, or odd or even only?
         * @property {string} jobTitle description to use on the job in the print queue
         * @property {string} documentUrl the document url to use in headers and footers
         */
        settings: iSettings,

        /**
         * Get the complete currently displayed document as string of HTML.
         * 
         * Form values are preserved in the source document then the document cloned.
         * 
         * A base element is created if required.
         * style elements are included.
         * script and object elements are not included.
         * 
         * @memberof MeadCoScriptXPrintHTML
         * @property {string} documentContentToPrint the current content in the window document as html 
         * */
        get documentContentToPrint() {
            return documentContent();
        },

        /**
         * Get the complete currently displayed document in a frame as string of HTML.
         *
         * Form values are preserved in the source document then the document cloned.
         *
         * A base element is created if required.
         * style elements are included.
         * script and object elements are not included.
         *
         * @memberof MeadCoScriptXPrintHTML
         * @function frameContentToPrint
         * @param {string} sFrame the name of the frame
         * @returns {string} the current content in the frame window document as html
         * */
        frameContentToPrint: function (sFrame) {
            return frameContent(sFrame);
        },

        /**
         * Print the complete current document in the window using the settings made by property updates before this function is called.
         *
         * @memberof MeadCoScriptXPrintHTML    
         * @function printDocument
         * @param {function({string})} fnCallOnDone function to call when printing complete (and output returned), arg is null on no error, else error message.
         * @param {function(status,sInformation,data)} fnCallback function to call when job status is updated
         * @param {any} data object to give pass to fnCallback
         * @returns {boolean} - true if a print was started (otherwise an error will be thrown)
         */
        printDocument: function (fnCallOnDone, fnCallback, data) {
            return printHtmlAtServer(MeadCo.ScriptX.Print.ContentType.INNERHTML, documentContent(), document.title, fnCallOnDone, fnCallback, data);
        },

        /**
         * Print the complete current document in the named iframe using the settings made by property updates before this function is called.
         *
         * @memberof MeadCoScriptXPrintHTML    
         * @function printFrame
         * @param {string} sFrame the name of the iframe whose content is to be printed.
         * @param {function({string})} fnCallOnDone function to call when printing complete (and output returned), arg is null on no error, else error message.
         * @param {function(status,sInformation,data)} fnCallback function to call when job status is updated
         * @param {any} data object to give pass to fnCallback
         * @return {boolean} - true if a print was started (otherwise an error will be thrown)
         */
        printFrame: function (sFrame, fnCallOnDone, fnCallback, data) {
            return printHtmlAtServer(MeadCo.ScriptX.Print.ContentType.INNERHTML, frameContent(sFrame), document.title, fnCallOnDone, fnCallback, data);
        },

        /**
         * Print the document obtained by downloading the given url using the settings made by property updates before this function is called.
         *
         * @memberof MeadCoScriptXPrintHTML    
         * @function printFromUrl
         * @param {string} sUrl the fully qualified url to the document to be printed.
         * @param {function({string})} fnCallOnDone function to call when printing complete (and output returned), arg is null on no error, else error message.
         * @param {function(status,sInformation,data)} fnCallback function to call when job status is updated
         * @param {any} data object to give pass to fnCallback
         * @return {boolean} - true if a print was started (otherwise an error will be thrown)
         */
        printFromUrl: function (sUrl, fnCallOnDone, fnCallback, data) {
            return printHtmlAtServer(MeadCo.ScriptX.Print.ContentType.URL, sUrl, sUrl, fnCallOnDone, fnCallback, data);
        },

        /**
         * Print the fragment of html using the settings made by property updates before this function is called.
         *
         * @memberof MeadCoScriptXPrintHTML    
         * @function printHtml
         * @param {string} sHtml fragment/snippet of html to print, must be complete HTML document.
         * @param {function({string})} fnCallOnDone function to call when printing complete (and output returned), arg is null on no error, else error message.
         * @param {function(status,sInformation,data)} fnCallback function to call when job status is updated
         * @param {any} data object to give pass to fnCallback
         * @return {boolean} - true if a print was started (otherwise an error will be thrown)
         */
        printHtml: function (sHtml, fnCallOnDone, fnCallback, data) {
            return printHtmlAtServer(MeadCo.ScriptX.Print.ContentType.HTML, sHtml, "HTML snippet", fnCallOnDone, fnCallback, data);
        },

        /**
         * Specify the server and the subscription/license id to use on AJAX calls. No call is made in this function
         * 
         * @function connectLite
         * @memberof MeadCoScriptXPrintHTML
         * @param {string} serverUrl the 'root' url to the server (the api path will be added by the library)
         * @param {string} licenseGuid the license/subscription identifier
         */
        connectLite: function (serverUrl, licenseGuid) {
            MeadCo.ScriptX.Print.connectLite(serverUrl, licenseGuid);
        },

        /**
         * Specify the server to use and the subscription/license id. 
         * 
         * Attempt to connect to the defined ScriptX.Services server and obtain
         * default soft html and device settings for the default device as well as the list
         * of available printers. 
         * 
         * This call is not required if client side code doesnt need to know about available printers
         * but can assume (at least .connectLite() is required).
         *
         * This call is synchronous and therefore not recommended. Use connectAsync()
         * 
         * @function connect
         * @memberof MeadCoScriptXPrintHTML
         * @param {string} serverUrl the 'root' url to the server (the api path will be added by the library)
         * @param {string} licenseGuid the license/subscription identifier
         * @param {function} onFail the function to call if an error occurs when making the connection
         */
        connect: function (serverUrl, licenseGuid, onFail) {
            MeadCo.warn("Print.HTML SYNC connection request");
            MeadCo.ScriptX.Print.connectLite(serverUrl, licenseGuid);
            MeadCo.ScriptX.Print.getFromServer("/htmlPrintDefaults/?units=" + settingsCache.page.units, false,
                function (data) {
                    MeadCo.log("got default html settings");
                    updateSettingsWithServerDefaults(data.settings);
                    if (data.device !== null) {
                        MeadCo.ScriptX.Print.connectDeviceAndPrinters(data.device, data.availablePrinters);
                    }
                }, onFail);
        },

        /**
         * Specify the server to use and the subscription/license id. 
         * 
         * Attempt to connect to the defined ScriptX.Services server and obtain
         * default soft html and device settings for the default device as well as the list
         * of available printers. 
         * 
         * This call is not required if client side code doesnt need to know about available printers
         * but can assume (at least .connectLite() is required).
         * 
         * @function connectAsync
         * @memberof MeadCoScriptXPrintHTML
         * @param {string} serverUrl the 'root' url to the server (the api path will be added by the library)
         * @param {string} licenseGuid the license/subscription identifier
         * @param {function} resolve function to call on success
         * @param {function} reject function to call on failure
         */
        connectAsync: function (serverUrl, licenseGuid, resolve, reject) {
            MeadCo.log("Print.HTML ASYNC connection request");
            MeadCo.ScriptX.Print.connectLite(serverUrl, licenseGuid);
            MeadCo.ScriptX.Print.getFromServer("/htmlPrintDefaults/?units=" + settingsCache.page.units, true,
                function (data) {
                    MeadCo.log("got default html settings");
                    if (updateSettingsWithServerDefaults(data.settings)) {
                        if (data.device !== null) {
                            MeadCo.ScriptX.Print.connectDeviceAndPrinters(data.device, data.availablePrinters);
                        }
                        resolve(2);
                    }
                    else {
                        reject("Server did not respond with valid settings");
                    }
                }, reject);
        },

        /**
         * Get the version of this module as a string major.minor.hotfix.build
         * @property {string} version
         * @memberof MeadCoScriptXPrintHTML
         */
        get version() { return moduleversion; }

    };

});
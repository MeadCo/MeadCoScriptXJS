/*!
 * MeadCo.ScriptX.Print.HTML (support for modern browsers and IE 11) JS client library
 * Copyright 2017 Mead & Company. All rights reserved.
 * https://github.com/MeadCo/ScriptX.Print.Client
 *
 * Released under the MIT license
 */

; (function (name, definition) {
    extendMeadCoNamespace(name, definition);
})('MeadCo.ScriptX.Print.HTML', function () {

    var moduleversion = "1.4.8.0";

    var mPageOrientation = {
        DEFAULT: 0,
        LANDSCAPE: 1,
        PORTRAIT: 2
    };

    var mPageMarginUnits = {
        DEFAULT: 0,
        INCHES: 1,
        MM: 2
    };

    var mCollateOptions = {
        DEFAULT: 0,
        TRUE: 1,
        FALSE: 2
    };

    var mPrintingPass = {
        ALL: 1,
        ODD: 2,
        EVEN: 3,
        ODDANDEVEN: 4
    };

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
            units: mPageMarginUnits.DEFAULT,
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
            if (str.length === 0) {
                str = "%20";
            }
            settingsCache.header = str;
        },
        get header() {
            return settingsCache.header;
        },

        set footer(str) {
            if (str.length === 0) {
                str = "%20";
            }
            settingsCache.footer = str;
        },

        get footer() {
            return settingsCache.footer;
        },

        set headerFooterFont(str) {
            if (str.length === 0) {
                str = "%20";
            }
            settingsCache.headerFooterFont = str;
        },

        get headerFooterFont() {
            return settingsCache.headerFooterFont;
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
            settingsCache.longDateFormat = x;
        },

        set longDateFormat(x) {
            settingsCache.longDateFormat = x;
        },

        set printBackgroundColorsAndImages(b) {
            settingsCache.printBackgroundColorsAndImages = b;
        },

        get printBackgroundColorsAndImages() {
            return settingsCache.printBackgroundColorsAndImages;
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
        settingsCache = sDefaults;
        settingsCache.locale = (navigator.languages && navigator.languages.length)
            ? navigator.languages[0]
            : navigator.language;
        settingsCache.timezoneOffset = (new Date()).getTimezoneOffset();
        settingsCache.documentUrl = document.URL;
        MeadCo.log("Settings cache updated, .locale: [" + settingsCache.locale + "], .offset: " + settingsCache.timezoneOffset);
    }

    function persistData($element) {
        // preserve all form values.
        //Radiobuttons and checkboxes
        $(":checked", $element).each(function () {
            this.setAttribute('checked', 'checked');
        });
        //simple text inputs
        $("input[type='text']", $element).each(function () {
            this.setAttribute('value', $(this).val());
        });
        $("select", $element).each(function () {
            var $select = $(this);
            $("option", $select).each(function () {
                if ($select.val() == $(this).val())
                    this.setAttribute('selected', 'selected');
            });
        });
        $("textarea", $element).each(function () {
            var value = $(this).attr('value');
            if ($.browser.mozilla && this.firstChild)
                this.firstChild.textContent = value;
            else
                this.innerHTML = value;
        });

    }

    function getBaseHref() {
        var port = (window.location.port) ? ':' + window.location.port : '';
        return window.location.protocol + '//' + window.location.hostname + port + window.location.pathname;
    }

    function printableHtmlDocument($html) {

        persistData($html);
        $("script", $html).remove();
        $("object", $html).remove();

        if (!$("head>base", $html).length) {
            MeadCo.log("No base element, fabricating one to: " + getBaseHref());
            var base = $("<base>",
            {
                href: getBaseHref()
            });
            $("head", $html).prepend(base);
        }

        return $html.html();
    }

    function documentHtml() {
        return printableHtmlDocument($("html"));
    }

    function documentContent() {
        if (this.jQuery) {
            return documentHtml();
        }

        throw new Error("No supported html snapshot helper available (jQuery is required)");
    }

    function frameContent(sFrame) {
        if (this.jQuery) {
            var $frame = $("#" + sFrame);

            if (!$frame.length)
                throw new Error("Unabled to print frame - frame does not exist");

            return printableHtmlDocument($frame.contents().find("html"));
        }

        throw new Error("No supported framed html snapshot helper available (jQuery is required)");

    }

    function printHtmlAtServer(contentType, content, title, fnDone, fnCallback, data) {
        var htmlPrintSettings = settingsCache;
        htmlPrintSettings.jobTitle = title;
        return MeadCo.ScriptX.Print.printHtml(contentType, content, htmlPrintSettings, fnDone, null, fnCallback, data);
    }

    MeadCo.log("MeadCo.ScriptX.Print.HTML " + moduleversion + " loaded.");

    if (!this.jQuery) {
        MeadCo.log("**** warning :: no jQuery");
    }

    // public API
    return {
        PageMarginUnits: mPageMarginUnits,
        PageOrientation: mPageOrientation,
        CollateOptions: mCollateOptions,
        PrintingPasses: mPrintingPass,

        settings: iSettings,

        printDocument: function (fnCallOnDone, fnCallback, data) {
            return printHtmlAtServer(MeadCo.ScriptX.Print.ContentType.INNERTHTML, documentContent(), document.title, fnCallOnDone, fnCallback, data);
        },

        printFrame: function (sFrame, fnCallOnDone, fnCallback, data) {
            return printHtmlAtServer(MeadCo.ScriptX.Print.ContentType.INNERTHTML, frameContent(sFrame), document.title, fnCallOnDone, fnCallback, data);
        },

        printFromUrl: function (sUrl, fnCallOnDone, fnCallback, data) {
            return printHtmlAtServer(MeadCo.ScriptX.Print.ContentType.URL, sUrl, sUrl, fnCallOnDone, fnCallback, data);
        },

        printHtml: function (sHtml, fnCallOnDone, fnCallback, data) {
            return printHtmlAtServer(MeadCo.ScriptX.Print.ContentType.HTML, sHtml, "HTML snippet", fnCallOnDone, fnCallback, data);
        },

        connectLite: function (serverUrl, licenseGuid) {
            MeadCo.ScriptX.Print.connectLite(serverUrl, licenseGuid);
        },

        connect: function (serverUrl, licenseGuid) {
            MeadCo.warn("Print.HTML SYNC connection request");
            MeadCo.ScriptX.Print.connectLite(serverUrl, licenseGuid);
            MeadCo.ScriptX.Print.getFromServer("/htmlPrintDefaults/?units=" + settingsCache.page.units, false,
                function (data) {
                    MeadCo.log("got default html settings");
                    updateSettingsWithServerDefaults(data.settings);
                    if (data.device != null) {
                        MeadCo.ScriptX.Print.connectDeviceAndPrinters(data.device, data.availablePrinters);
                    }
                });
        },

        connectAsync: function (serverUrl, licenseGuid, resolve, reject) {
            MeadCo.log("Print.HTML ASYNC connection request");
            MeadCo.ScriptX.Print.connectLite(serverUrl, licenseGuid);
            MeadCo.ScriptX.Print.getFromServer("/htmlPrintDefaults/?units=" + settingsCache.page.units, true,
                function (data) {
                    MeadCo.log("got default html settings");
                    updateSettingsWithServerDefaults(data.settings);
                    if (data.device != null) {
                        MeadCo.ScriptX.Print.connectDeviceAndPrinters(data.device, data.availablePrinters);
                    }
                    resolve();
                }, reject);
        },

        get version() { return moduleversion }

    };

});
/**
 * MeadCo.ScriptX.Print
 * 
 * A static class wrapping calls to the server API. 
 * 
 * Requires: meadco-core.js
 * 
 * Includes processing of calls to the print api that return "printing to file" including collecting the file output. 
 * 
 * Provides attribute based connection to the server.
 * 
 * Synchronous AJAX calls are deprecated in all browsers but may be useful to "quick start" use of older code. It is recommended that code is moved
 * to using asynchronous calls as soon as practical. The MeadCoScriptXJS library can assist with this as it delivers promise rather than callback based code.
 *
 * @namespace MeadCoScriptXPrint
 */

; (function (name, definition) {
    extendMeadCoNamespace(name, definition);
})('MeadCo.ScriptX.Print', function () {
    // module version and the api we are coded for
    var version = "1.5.7.0";
    var htmlApiLocation = "v1/printHtml";
    var pdfApiLocation = "v1/printPdf";

    // default printer 
    var printerName = "";

    /**
     * Enum to describe the units used on measurements 
     *
     * @memberof MeadCoScriptXPrint
     * @typedef {number} MeasurementUnits
     * @enum {MeasurementUnits}
     * @readonly
     * @property {number} DEFAULT 0 use the default at the print server
     * @property {number} MM 1 millimeters
     * @property {number} INCHES 2 
     */
    var enumMeasurementUnits = {
        DEFAULT: 0,
        INCHES: 1,
        MM: 2
    };

    /**
     * Describe the size of a page by its width and height.
     * 
     * @typedef PageSize
     * @memberof MeadCoScriptXPrint
     * @property {number} width width of paper in requested units
     * @property {number} height height of paper in requested units
     * */
    var PageSize;  // for doc generator

    /**
     * Describe the margins within which to print.
     * 
     * @typedef Margins
     * @memberof MeadCoScriptXPrint
     * @property {number} left left margin in requested units
     * @property {number} top top margin in requested units
     * @property {number} right right margin in requested units
     * @property {number} bottom bottom margin in requested units
     * */
    var Margins;  // for doc generator

    /**
     * Information about and the settings to use with an output printing device
     * See also: https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXServices/WebServiceAPIReference/PrintHtml/deviceinfoGET
     * 
     * @typedef DeviceSettingsObject
     * @memberof MeadCoScriptXPrint
     * @property {string} printerName The name of the printer
     * @property {string} paperSizeName The descriptive name of the papersize, e.g. "A4"
     * @property {string} paperSourceName The descriptive name of the paper source, e.g. "Upper tray"
     * @property {CollateOptions} collate The collation to use when printing
     * @property {number} copies The number of copies to print
     * @property {DuplexOptions} duplex The dulex printing option
     * @property {MeasurementUnits} units Measurement units for papersize and margins
     * @property {PageSize} paperPageSize The size of the paper (in requested units)
     * @property {Margins} unprintableMargins The margin that cannot be printed in (in requested units)
     * @property {number} status Status code for the status of the device. Note this is not reliable, it is the cached return from the first server enquiry only.
     * @property {string} port Printer connection port name/description
     * @property {number} attributes Printer attributes
     * @property {string} serverName Name of the server to which the printer is connected
     * @property {string} shareName Name of the share 
     * @property {string} location description of the location of the printer
     * @property {boolean} isLocal true if the printer is local to the server
     * @property {boolean} isNetwork true if the server is on the network
     * @property {boolean} isShared true if the printer is shared 
     * @property {boolean} isDefault true if this is the default printer on the service
     * @property {Array.<string>} bins Array of the names of the available paper sources
     * @property {Array.<string>} forms Array of the names of the avbailable paper sizes
     * */
    var DeviceSettingsObject; // for doc generator

    var deviceSettings = {};
    var module = this;

    var activePrintQueue = []; // current job queue

    var server = ""; // url to the server, server is CORS restricted
    var licenseGuid = "";
    var bConnected = false;

    var bDoneAuto = false;

    var availablePrinters = [];

    /**
     * Enum for type of content being posted to printHtml API
     *
     * @memberof MeadCoScriptXPrint    
     * @typedef {number} ContentType
     * @enum {ContentType}
     * @readonly
     * @property {number} URL 1 the url will be downloaded and printed
     * @property {number} HTML 2 the passed string is assumed to be a complete html document .. <html>..</html>
     * @property {number} INNERHTML 4 the passed string is a complete html document but missing the html tags
     */
    var enumContentType = {
        URL: 1, // the url will be downloaded and printed
        HTML: 2, // the passed string is assumed to be a complete html document .. <html>..</html>
        INNERHTML: 4 // the passed string is a complete html document but missing the html tags
    };

    var enumResponseStatus = {
        UNKNOWN: 0,
        QUEUEDTODEVICE: 1,
        QUEUEDTOFILE: 2,
        SOFTERROR: 3,
        OK: 4
    };

    /**
     * Enum for type of content being posted to printHtml API
     *
     * @memberof MeadCoScriptXPrint    
     * @typedef {number} ErrorAction
     * @enum {ErrorAction}
     * @readonly
     * @property {number} REPORT 1 Call MeadCo.ScriptX.Print.reportServerError(errMsg)
     * @property {number} THROW 2 throw an error : throw errMsg
     */
    var enumErrorAction = {
        REPORT: 1,
        THROW: 2
    };
    var errorAction = enumErrorAction.REPORT;

    /**
     * Enum for status code returned to print progress callbacks
     *
     * @memberof MeadCoScriptXPrint    
     * @typedef {number} PrintStatus
     * @enum {PrintStatus}
     * @readonly
     * @property {number} NOTSTARTED 0
     * @property {number} QUEUED 1
     * @property {number} STARTING 2
     * @property {number} DOWNLOADING 3
     * @property {number} DOWNLOADED 4
     * @property {number} PRINTING 5
     * @property {number} COMPLETED 6
     * @property {number} PAUSED 7
     * @property {number} PRINTPDF 8
     * @property {number} ERROR -1
     * @property {number} ABANDONED -2
     */
    var enumPrintStatus = {
        NOTSTARTED: 0,

        // queue call back opcodes ...
        QUEUED: 1,
        STARTING: 2,
        DOWNLOADING: 3,
        DOWNLOADED: 4,
        PRINTING: 5,
        COMPLETED: 6,
        PAUSED: 7,
        PRINTPDF: 8,

        ERROR: -1,
        ABANDONED: -2
    };

    /**
     * Enum to describe the collation option when printing 
     *
     * @memberof MeadCoScriptXPrint   
     * @typedef {number} CollateOptions
     * @enum {CollateOptions}
     * @readonly
     * @property {number} DEFAULT 0 use the default at the print server
     * @property {number} TRUE 1 collate pages when printing
     * @property {number} FALSE 2 do not collate pages
     */
    var enumCollateOptions = {
        DEFAULT: 0,
        TRUE: 1,
        FALSE: 2
    };

    /**
     * Enum to describe the duplex print option to use when printing 
     *
     * @memberof MeadCoScriptXPrint
     * @typedef {number} DuplexOptions
     * @enum {DuplexOptions}
     * @readonly
     * @property {number} DEFAULT 0 use the default at the print server
     * @property {number} SIMPLEX 1 
     * @property {number} VERTICAL 2 
     * @property {number} HORIZONTAL 3
     */
    var enumDuplexOptions = {
        DEFAULT: 0,
        SIMPLEX: 1,
        VERTICAL: 2,
        HORIZONTAL: 3
    };

    function queueJob(data) {
        activePrintQueue.push(data);
        MeadCo.log("ScriptX.Print queueJob, jobCount: " + activePrintQueue.length);
    }

    function jobCount() {
        MeadCo.log("ScriptX.Print jobCount: " + activePrintQueue.length);
        return activePrintQueue.length;
    }

    function findJob(id) {
        var i;
        for (i = 0; i < activePrintQueue.length; i++) {
            if (activePrintQueue[i].jobIdentifier === id) {
                return activePrintQueue[i];
            }
        }
        return null;
    }

    function updateJob(data) {
        var i;
        for (i = 0; i < activePrintQueue.length; i++) {
            if (activePrintQueue[i].jobIdentifier === data.jobIdentifier) {
                Object.keys(data).forEach(function (key) {
                    activePrintQueue[i][key] = data[key];
                });
                return;
            }
        }
        console.warn("Unable to find job: " + data.jobIdentifier + " to update it");
    }

    function removeJob(id) {
        var i;
        for (i = 0; i < activePrintQueue.length; i++) {
            if (activePrintQueue[i].jobIdentifier === id) {
                activePrintQueue.splice(i, 1);
                MeadCo.log("ScriptX.Print remove job, jobCount: " + activePrintQueue.length);
                return;
            }
        }
        console.warn("Unable to find job: " + id + " to remove it");
    }

    function progress(requestData, status, information) {
        if (typeof requestData.OnProgress === "function") {
            requestData.OnProgress(status, information, requestData.UserData);
        }
    }

    /*
     * Post a request to the server api/v1/print to print some html and monitor the print job 
     * to completion. If the server prints to file then the file is opened for the user (in a new window)
     * 
     * @function printHtmlAtServer
     * @memberof MeadCoScriptXPrint

     * @param {ContentType} contentType enum type of content given (html snippet, url)
     * @param {string} content the content - a url, html snippet or complete html
     * @param {object} htmlPrintSettings the settings to use - device annd html such as headers and footers
     * @param {function({string})} fnDone function to call when printing complete (and output returned), arg is null on no error, else error message
     * @param {function(status,sInformation,data)} fnProgress function to call when job status is updated
     * @param {any} data object to give pass to fnCallback
     * @return {boolean} - true if a print was started (otherwise an error will be thrown)
     */
    function printHtmlAtServer(contentType, content, htmlPrintSettings, fnDone, fnProgress, data) {
        MeadCo.log("started MeadCo.ScriptX.Print.print.printHtmlAtServer() Type: " + contentType + ", printerName: " + printerName);
        if (contentType === enumContentType.URL) {
            MeadCo.log(".. request print url: " + content);
        }
        var devInfo;

        if (content === null || typeof content === "undefined" || (typeof content === "string" && content.length === 0)) {
            MeadCo.ScriptX.Print.reportError("Request to print no content - access denied?");          
            if (typeof fnDone === "function") {
                fnDone("Request to print no content");
            }
            return false;
        }

        if (printerName === "") {
            devInfo = {};
        } else {
            devInfo = deviceSettings[printerName];
        }

        var requestData = {
            ContentType: contentType,
            Content: content,
            Settings: htmlPrintSettings,
            Device: devInfo,
            OnProgress: fnProgress,
            UserData: data
        };

        var serverApi = MeadCo.makeApiEndPoint(server, htmlApiLocation);
        return printAtServer(serverApi,requestData,
        {
            fail: function (jqXhr, textStatus, errorThrown) {
                var err = MeadCo.parseAjaxError("MeadCo.ScriptX.Print.printHtmlAtServer", jqXhr, textStatus, errorThrown);
                progress(requestData, enumPrintStatus.ERROR, err);
                MeadCo.ScriptX.Print.reportError(err);
                if (typeof fnDone === "function") {
                    fnDone("Server error");
                }
            },

            queuedToFile: function (data) {
                MeadCo.log("default handler on queued to file response");
                progress(requestData, enumPrintStatus.QUEUED);
                monitorJob(serverApi,requestData, data.jobIdentifier,
                    -1,
                    function (data) {
                        if (data !== null) {
                            MeadCo.log("Will download printed file");
                            progress(requestData, enumPrintStatus.COMPLETED);
                            window.open(server + "/download/" + data.jobIdentifier, "_self");
                        }

                        if (typeof fnDone === "function") {
                            fnDone(data === null ? "Server error" : null);
                        }
                    });
            },

            queuedToDevice: function (data) {
                MeadCo.log("print was queued to device");
                progress(requestData, enumPrintStatus.QUEUED);
                monitorJob(serverApi,requestData, data.jobIdentifier,
                    -1,
                    function (data) {
                        if (data !== null) {
                            progress(requestData, enumPrintStatus.COMPLETED);
                        }

                        if (typeof fnDone === "function") {
                            fnDone(data === null ? "Server error" : null);
                        }
                    });
            },

            softError: function (data) {
                progress(requestData, enumPrintStatus.ERROR, data.message);
                MeadCo.ScriptX.Print.reportError(data.message);
                MeadCo.log("print has soft error");
                removeJob(data.jobIdentifier);
                if (typeof fnDone === "function") {
                    MeadCo.log("Call fnDone");
                    fnDone("Server error");
                }
            },

            ok: function (data) {
                progress(requestData, enumPrintStatus.COMPLETED);
                MeadCo.log("printed ok, no further information");
                if (typeof fnDone === "function") {
                    fnDone(null);
                }
            }
        });
    }

    /**
     * Post a request to the server api/v1/print to print some html and monitor the print job 
     * to completion. If the server prints to file then the file is opened for the user (in a new window)
     * 
     * @function printPdfAtServer
     * @memberof MeadCoScriptXPrint
     * @param {string} document full url to the pdf document to be printed
     * @param {object} pdfPrintSettings the settings to use such as rotation, scaling. device settings (printer to use, copies etc) are taken from this static
     * @param {function({string})} fnDone function to call when printing complete (and output returned), arg is null on no error, else error message.
     * @param {function(status,sInformation,data)} fnProgress function to call when job status is updated
     * @param {any} data object to give pass to fnCallback
     * @return {boolean} - true if a print was started (otherwise an error will be thrown)
     * @private
     */
    function printPdfAtServer(document, pdfPrintSettings, fnDone, fnProgress, data) {
        MeadCo.log("started MeadCo.ScriptX.Print.print.printPdfAtServer() document: " + document + ", printerName: " + printerName);

        var devInfo;

        if (document === null || typeof document === "undefined" || (typeof document === "string" && document.length === 0)) {
            MeadCo.ScriptX.Print.reportError("The document to print must be given.");
            if (typeof fnDone === "function") {
                fnDone("Request to print no content");
            }
            return false;
        }

        if (printerName === "") {
            devInfo = {};
        } else {
            devInfo = deviceSettings[printerName];
        }

        var requestData = {
            Document: document,
            Description: pdfPrintSettings.jobDescription,
            Settings: pdfPrintSettings,
            Device: devInfo,
            OnProgress: fnProgress,
            UserData: data
        };

        var serverApi = MeadCo.makeApiEndPoint(server, pdfApiLocation);

        return printAtServer(serverApi,requestData,
            {
                fail: function (jqXhr, textStatus, errorThrown) {
                    var err = MeadCo.parseAjaxError("MeadCo.ScriptX.Print.printPdfAtServer", jqXhr, textStatus, errorThrown);
                    progress(requestData, enumPrintStatus.ERROR, err);
                    MeadCo.ScriptX.Print.reportError(err);
                    if (typeof fnDone === "function") {
                        fnDone("Server error");
                    }
                },

                queuedToFile: function (data) {
                    MeadCo.log("default handler on queued to file response");
                    progress(requestData, enumPrintStatus.QUEUED);
                    monitorJob(serverApi,requestData, data.jobIdentifier,
                        -1,
                        function (data) {
                            if (data !== null) {
                                MeadCo.log("Will download printed file");
                                progress(requestData, enumPrintStatus.COMPLETED);
                                window.open(server + "/download/" + data.jobIdentifier, "_self");
                            }

                            if (typeof fnDone === "function") {
                                fnDone(data === null ? "Server error" : null);
                            }
                        });
                },

                queuedToDevice: function (data) {
                    MeadCo.log("print was queued to device");
                    progress(requestData, enumPrintStatus.QUEUED);
                    monitorJob(serverApi,requestData, data.jobIdentifier,
                        -1,
                        function (data) {
                            if (data !== null) {
                                progress(requestData, enumPrintStatus.COMPLETED);
                            }

                            if (typeof fnDone === "function") {
                                fnDone(data === null ? "Server error" : null);
                            }
                        });
                },

                softError: function (data) {
                    progress(requestData, enumPrintStatus.ERROR, data.message);
                    MeadCo.ScriptX.Print.reportError(data.message);
                    MeadCo.log("printpdf call has soft error, remove job: " + data.jobIdentifier);
                    removeJob(data.jobIdentifier);
                    if (typeof fnDone === "function") {
                        MeadCo.log("Call fnDone");
                        fnDone("Server error");
                    }
                },

                ok: function (data) {
                    progress(requestData, enumPrintStatus.COMPLETED);
                    MeadCo.log("printed ok, no further information");
                    if (typeof fnDone === "function") {
                        fnDone(null);
                    }
                }
            });
    }

    function setServer(serverUrl, clientLicenseGuid) {
        if (serverUrl.length > 0) {
            MeadCo.log("Print server requested: " + serverUrl + " => " + MeadCo.makeApiEndPoint(serverUrl, htmlApiLocation) + " with license: " + clientLicenseGuid);
            server = MeadCo.makeApiEndPoint(serverUrl, htmlApiLocation);
            licenseGuid = clientLicenseGuid;
            printerName = "";
            deviceSettings = {};
            activePrintQueue = []; // warning, will kill any current monitoring
            bConnected = false;
            availablePrinters = [];
        }
    }

    function connectToServer(serverUrl, clientLicenseGuid) {
        setServer(serverUrl, clientLicenseGuid);
        // note that this will silently fail if no advanced printing license
        getDeviceSettings({ name: "default", async: false });
    }

    function connectToServerAsync(serverUrl, clientLicenseGuid, resolve, reject) {
        setServer(serverUrl, clientLicenseGuid);
        // note that this will silently fail if no advanced printing license
        getDeviceSettings({
            name: "default",
            done: resolve,
            async: true,
            fail: reject
        });
    }

    // testServerConnection
    //
    // Can we ask something and get a respponse, without using a license - checks the server is there.
    //
    function testServerConnection(serverUrl, resolve, reject) {
        if (serverUrl.length > 0) {
            // use the license API
            var licenseApi = "v1/licensing";
            MeadCo.log("Test server requested: " + serverUrl + " => " + MeadCo.makeApiEndPoint(serverUrl, licenseApi));
            serverUrl = MeadCo.makeApiEndPoint(serverUrl, licenseApi);
            if (module.jQuery) {
                var serviceUrl = serverUrl + "/ping";
                MeadCo.log(".ajax() get: " + serviceUrl);
                module.jQuery.ajax(serviceUrl,
                    {
                        method: "GET",
                        dataType: "json",
                        cache: false,
                        async: true
                    }).done(function (data) {
                        resolve(data);
                    })
                    .fail(function (jqXhr, textStatus, errorThrown) {
                        errorThrown = MeadCo.parseAjaxError("MeadCo.ScriptX.Print.testServerConnection:",jqXhr, textStatus, errorThrown);
                        if (typeof reject === "function")
                            reject(errorThrown);
                    });
            }
            else {
                MeadCo.error("jQuery is required by ScriptX.Services");
            }
        }
    }

    /**
     * Post a request to print
     * 
     * @param {string} serverAndApi The full server url api endpoint (e.g. http://localhost:3000/api/printhtml). The method '/print' will be added. 
     * @param {object} requestData The data to be posted
     * @param {functionList} responseInterface Callbacks to process responses
     * @returns {bool} true if request sent
     */
    function printAtServer(serverAndApi, requestData, responseInterface) {

        if (server.length <= 0) {
            throw new Error("MeadCo.ScriptX.Print : print server URL is not set or is invalid");
        }

        var fakeJob = {
            jobIdentifier: Date.now(),
            printerName: requestData.Device.printerName,
            jobName: "Job starting"
        };


        if (module.jQuery) {
            MeadCo.log(".ajax() post to: " + serverAndApi);
            // MeadCo.log(JSON.stringify(requestData));

            queueJob(fakeJob); // essentially a lock on the queue to stop it looking empty while we await the result
            module.jQuery.ajax(serverAndApi + "/print",
                {
                    data: JSON.stringify(requestData),
                    dataType: "json",
                    contentType: "application/json",
                    method: "POST",
                    headers: {
                        "Authorization": "Basic " + btoa(licenseGuid + ":")
                    }
                })
                .done(function (data) {
                    MeadCo.log("Success response: " + data.status);
                    data.printerName = requestData.Device.printerName;
                    data.jobName = requestData.Settings.jobTitle;
                    queueJob(data);
                    removeJob(fakeJob.jobIdentifier);
                    switch (data.status) {
                        case enumResponseStatus.QUEUEDTOFILE:
                            responseInterface.queuedToFile(data);
                            break;

                        case enumResponseStatus.QUEUEDTODEVICE:
                            responseInterface.queuedToDevice(data);
                            break;

                        case enumResponseStatus.SOFTERROR:
                        case enumResponseStatus.UNKNOWN:
                            responseInterface.softError(data);
                            break;

                        case enumResponseStatus.OK:
                            responseInterface.ok(data);
                            break;
                    }
                })
                .fail(function (jqXhr, textStatus, errorThrown) {
                    removeJob(fakeJob.jobIdentifier);
                    if (typeof responseInterface.fail === "function") {
                        responseInterface.fail(jqXhr, textStatus, errorThrown);
                    }
                });
            return true;
        } else {
            if (typeof responseInterface.fail === "function") {
                responseInterface.fail("MeadCo.ScriptX.Print : no known ajax helper available");
            }
            else {
                throw new Error("MeadCo.ScriptX.Print : no known ajax helper available");
            }
        }
    }

    /**
     * Call an API on the server with GET
     * 
     * @function getFromServer
     * @memberof MeadCoScriptXPrint
     * @param {string} sApi the api to call on the connected server
     * @param {bool} async true for asynchronous call, false for synchronous 
     * @param {function} onSuccess function to call on success
     * @param {function(errorText)} onFail function to call on failure
     * @private
     */
    function getFromServer(sApi, async, onSuccess, onFail) {
        if (module.jQuery) {
            var serviceUrl = server + sApi;
            MeadCo.log(".ajax() get: " + serviceUrl);
            module.jQuery.ajax(serviceUrl,
                {
                    method: "GET",
                    dataType: "json",
                    cache: false,
                    async: async,
                    headers: {
                        "Authorization": "Basic " + btoa(licenseGuid + ":")
                    }
                }).done(function (data) {
                    bConnected = true;
                    onSuccess(data);
                })
                .fail(function (jqXhr, textStatus, errorThrown) {
                    errorThrown = MeadCo.parseAjaxError("MeadCo.ScriptX.Print.getFromServer:", jqXhr, textStatus, errorThrown);
                    if (typeof onFail === "function")
                        onFail(errorThrown);
                });
        } else {
            if (typeof onFail === "function") {
                onFail("MeadCo.ScriptX.Print : no known ajax helper available");
            }
            else
                throw new Error("MeadCo.ScriptX.Print : no known ajax helper available");
        }

    }

    /**
     * Monitor a job that has been known to start  on the server. Get job status from the server and record in the job queue 
     * and process status appropriately. Progress callbacks will occur.
     * 
     * @function monitorJob
     * @memberof MeadCoScriptXPrint
     * @param {string} serverAndApi The full server url api endpoint (e.g. http://localhost:3000/api/printhtml). The method '/status/' will be added.
     * @param {string} requestData The original data sent with the print request
     * @param {string} jobId The id return from the server for the job (to be monitored)
     * @param {number} timeOut Time give the job to complete or assume has got stuck, -1 means no timeout.
     * @param {function({object})} functionComplete function to call when job is complete. Argument is null on error, the data returned from the status call on success,.
     * @private
     */
    function monitorJob(serverAndApi,requestData, jobId, timeOut, functionComplete) {
        MeadCo.log("monitorJob: " + jobId);
        var counter = 0;
        var interval = 1000;
        var bWaiting = false;
        var intervalId = window.setInterval(function () {
            if (!bWaiting) {
                MeadCo.log("Going to request status with .ajax");
                bWaiting = true;
                $.ajax(serverAndApi + "/status/" + jobId,
                    {
                        dataType: "json",
                        method: "GET",
                        cache: false,
                        headers: {
                            "Authorization": "Basic " + btoa(licenseGuid + ":")
                        }
                    }).done(function (data) {
                        MeadCo.log("jobStatus: " + data.status);
                        switch (data.status) {
                            case enumPrintStatus.COMPLETED:
                                MeadCo.log("clear interval: " + intervalId);
                                window.clearInterval(intervalId);
                                removeJob(jobId);
                                functionComplete(data);
                                break;

                            case enumPrintStatus.NOTSTARTED:
                            case enumPrintStatus.DOWNLOADED:
                            case enumPrintStatus.DOWNLOADING:
                            case enumPrintStatus.PRINTING:
                            case enumPrintStatus.QUEUED:
                            case enumPrintStatus.STARTING:
                            case enumPrintStatus.PAUSED:
                            case enumPrintStatus.PRINTPDF:
                                progress(requestData, data.status, data.message);
                                updateJob(data);
                                // keep going
                                if (timeOut > 0 && (++counter * interval) > timeOut) {
                                    window.clearInterval(intervalId);
                                    MeadCo.ScriptX.Print.reportError("unknown failure while printing.");
                                }
                                bWaiting = false;
                                break;

                            case enumPrintStatus.ERROR:
                            case enumPrintStatus.ABANDONED:
                                MeadCo.log("error status in monitorJob so clear interval: " + intervalId);
                                progress(requestData, data.status, data.message);
                                removeJob(jobId);
                                window.clearInterval(intervalId);
                                MeadCo.ScriptX.Print.reportError("The print failed with the error: " + data.message);
                                functionComplete(null);
                                break;

                            default:
                                progress(requestData, data.status, data.message);
                                MeadCo.log("unknown status in monitorJob so clear interval: " + intervalId);
                                removeJob(jobId);
                                window.clearInterval(intervalId);
                                functionComplete(null);
                                break;
                        }
                    })
                    .fail(function (jqXhr, textStatus, errorThrown) {

                        errorThrown = MeadCo.parseAjaxError("MeadCo.ScriptX.Print.monitorJob:", jqXhr, textStatus, errorThrown);

                        MeadCo.log("error: " + errorThrown + " in monitorJob so clear interval: " + intervalId);
                        progress(requestData, enumPrintStatus.ERROR, errorThrown);
                        removeJob(jobId);
                        window.clearInterval(intervalId);
                        functionComplete(null);
                    });
            } else {
                MeadCo.log("** info : still waiting for last status request to complete");
            }
        },
            interval);

        MeadCo.log("intervalId: " + intervalId);
    }

    function addOrUpdateDeviceSettings(data) {
        if (typeof data.printerName === "string") {
            deviceSettings[data.printerName] = data;
            if (data.isDefault && printerName.length === 0) {
                printerName = data.printerName;
            }
        }
    }

    function getDeviceSettings(oRequest) {
        oRequest.name = oRequest.name.replace(/\\/g, "||");
        MeadCo.log("Request get device info: " + oRequest.name);

        if (module.jQuery) {
            var serviceUrl = server + "/deviceinfo/" + encodeURIComponent(oRequest.name) + "/0";
            MeadCo.log(".ajax() get: " + serviceUrl);
            module.jQuery.ajax(serviceUrl,
                {
                    dataType: "json",
                    method: "GET",
                    cache: false,
                    async: oRequest.async, // => async if we have a callback
                    headers: {
                        "Authorization": "Basic " + btoa(licenseGuid + ":")
                    }
                })
                .done(function (data) {
                    bConnected = true;
                    addOrUpdateDeviceSettings(data);
                    if (typeof oRequest.done === "function") {
                        oRequest.done(data);
                    }
                })
                .fail(function (jqXhr, textStatus, errorThrown) {

                    errorThrown = MeadCo.parseAjaxError("MeadCo.ScriptX.Print.getDeviceSettings:", jqXhr, textStatus, errorThrown);
                    MeadCo.log("failed to getdevice: " + errorThrown);

                    if (typeof oRequest.fail === "function") {
                        oRequest.fail(errorThrown);
                    }
                });
        } else {
            if (typeof oRequest.fail === "function") {
                oRequest.fail("MeadCo.ScriptX.Print : no known ajax helper available");
            }
            else
                throw new Error("MeadCo.ScriptX.Print : no known ajax helper available");
        }

    }

    function getDeviceSettingsFor(sPrinterName) {
        if (typeof sPrinterName === "string" && sPrinterName !== "") {
            if (typeof deviceSettings[sPrinterName] === "undefined") {
                getDeviceSettings({
                    name: sPrinterName,
                    async: false,
                    fail: function (eTxt) { MeadCo.ScriptX.Print.reportError(eTxt); }
                });
            }

            return deviceSettings[sPrinterName];
        }

        return {};
    }

    // look for auto-processing attributes that define the server to connect to and the
    // license/subscription to be used. 
    //
    // This implementation is called by the public api useAttributes (called by factory and secmgr implementations)
    //
    function processAttributes() {
        MeadCo.log("MeadCo.ScriptX.Print ... looking for auto connect, already found?: " + bDoneAuto);
        if (this.jQuery && !bDoneAuto) {
            // protected API
            var printHtml = MeadCo.ScriptX.Print.HTML;
            var printApi = MeadCo.ScriptX.Print;
            var licenseApi = MeadCo.ScriptX.Print.Licensing;

            // general connection
            //
            // data-meadco-server is the root url, api/v1/printhtml, api/v1/licensing will be added by the library
            // as required.
            //
            // meadco-subscription present => cloud/on premise service
            // meadco-license present => for Windows PC service
            $("[data-meadco-subscription]").each(function () {
                if (typeof printApi === "undefined" || typeof printHtml === "undefined") {
                    console.warn("Unable to auto-connect subscription - print or printHtml API not present (yet?)");
                } else {
                    if (!bDoneAuto) {
                        var $this = $(this);
                        var data = $this.data();
                        MeadCo.log("Auto connect susbcription to: " +
                            data.meadcoServer + ", or " + data.meadcoPrinthtmlserver +
                            ", with subscription: " +
                            data.meadcoSubscription +
                            ", sync: " +
                            data.meadcoSyncinit);
                        var syncInit = ("" + data.meadcoSyncinit)
                            .toLowerCase() !==
                            "false"; // defaults to true if not specified

                        var server = data.meadcoServer;
                        if (typeof server === "undefined") {
                            server = data.meadcoPrinthtmlserver;
                        }

                        if (typeof server === "undefined") {
                            console.error("No server specified");
                        } else {
                            // in case there will be a request for the subnscription info ..
                            if (typeof licenseApi !== "undefined")
                                licenseApi.connect(server, data.meadcoSubscription);

                            if (!syncInit) {
                                MeadCo.log("Async connectlite...");
                                printApi.connectLite(server, data.meadcoSubscription);
                            } else {
                                console
                                    .warn("Synchronous connection is deprecated, please use data-meadco-syncinit='false'");
                                printHtml.connect(server, data.meadcoSubscription);
                            }
                            bDoneAuto = true;
                        }
                    }
                }
                return false;
            });

            $("[data-meadco-license]").each(function () {
                if (typeof printApi === "undefined" || typeof printHtml === "undefined" || typeof licenseApi === "undefined") {
                    console.warn("Unable to auto-connect client license - print or printHtml or license API not present (yet?)");
                } else {
                    if (!bDoneAuto) {
                        var $this = $(this);
                        var data = $this.data();
                        MeadCo.log("Auto connect client license to: " +
                            data.meadcoServer +
                            ", with license: " +
                            data.meadcoLicense +
                            ", path: " +
                            data.meadcoLicensePath +
                            ", revision: " +
                            data.meadcoLicenseRevision +
                            ", sync: " +
                            data.meadcoSyncinit);
                        var syncInit = ("" + data.meadcoSyncinit)
                            .toLowerCase() !==
                            "false"; // defaults to true if not specified
                        var server = data.meadcoServer;

                        if (!syncInit) {
                            MeadCo.log("Async connectlite...");
                            licenseApi.connectLite(server, data.meadcoLicense,
                                    data.meadcoLicenseRevision,
                                    data.meadcoLicensePath);
                            printApi.connectLite(server, data.meadcoLicense);
                        } else {
                            console
                                .warn("Synchronous connection is deprecated, please use data-meadco-syncinit='false'");
                            licenseApi.connect(server, data.meadcoLicense);
                            if (typeof data.meadcoLicensePath !== "undefined" &&
                                typeof data
                                .meadcoLicenseRevision !==
                                "undefined") { // if these are not defined then you must use meadco-secmgr.js
                                licenseApi.apply(data.meadcoLicense,
                                    data.meadcoLicenseRevision,
                                    data.meadcoLicensePath);
                            }
                            printHtml.connect(server, data.meadcoLicense);
                        }
                        bDoneAuto = true;
                    }
                }
                return false;
            });

        }
    }

    if (!module.jQuery) {
        MeadCo.log("**** warning :: no jQuery *******");
    }

    MeadCo.log("MeadCo.ScriptX.Print " + version + " loaded.");

    //////////////////////////////////////////////////
    // public API
    return {
        /*
         * Enum for type of content being posted to printHtml API
         * @readonly
         * @memberof MeadCoScriptXPrint
         * @enum { ContentType }
         * 
         * URL: 1 a get request will be issued to the url and the returned content will be printed
         * HTML: 2 the passed string is assumed to be a complete html document .. <html>..</html>
         * INNERTHTML: 4 the passed string is a complete html document but missing the html tags
         */
        ContentType: enumContentType,

        /* 
         * Enum for status code returned to print progress callbacks
         * @readonly
         * @memberof MeadCoScriptXPrint
         * @enum PrintStatus { number }
         */
        PrintStatus: enumPrintStatus,

        ErrorAction: enumErrorAction,

        CollateOptions: enumCollateOptions,
        DuplexOptions: enumDuplexOptions,   
        MeasurementUnits: enumMeasurementUnits,

        /**
         * Get/set the action to take when an error occurs
         * 
         * @memberof MeadCoScriptXPrint
         * @property {ErrorAction} onErrorAction - the action
         */
        get onErrorAction() {
            return errorAction;
        },

        set onErrorAction(action) {
            errorAction = action;
        },

        /** 
         *  Get/set the currently active printer
         *  @memberof MeadCoScriptXPrint
         *  @property {string} printerName - The name of the current printer in use.
         */
        get printerName() {
            return printerName;
        },

        set printerName(deviceRequest) {
            if (!(deviceRequest === printerName || deviceRequest.name === printerName)) {
                if (typeof deviceRequest === "string") {
                    // not already cached, go fetch (synchronously)
                    if (typeof deviceSettings[deviceRequest] === "undefined") {
                        getDeviceSettings({
                            name: deviceRequest,
                            done: function (data) {
                                printerName = data.printerName;
                            },
                            async: false,
                            fail: function (eTxt) {
                                MeadCo.ScriptX.Print.reportError(eTxt);
                            }
                        });
                    } else {
                        printerName = deviceRequest;
                    }
                } else {
                    getDeviceSettings(deviceRequest);
                }
            }
        },

        /**
         * Get the version of this module as a string major.minor.hotfix.build
         * @property {string} version
         * @memberof MeadCoScriptXPrint
         */
        get version() {
            return version;
        },

        /**
         * Get/set the cached device settings (papersize etc) for the currently active printer
         * @memberof MeadCoScriptXPrint
         * @property {DeviceSettingsObject} deviceSettings (see API /api/vi/printhtml/deviceInfo/ )
         */
        get deviceSettings() {
            return printerName !== "" ? deviceSettings[printerName] : {};
        },

        set deviceSettings(settings) {
            addOrUpdateDeviceSettings(settings);
        },

        /**
         * Get the device settings (papersize etc) for the named printer. This call is synchronous 
         * and not recommended. 
         * 
         * @function deviceSettingsFor
         * @memberof MeadCoScriptXPrint
         * @param {string} sPrinterName the name of the printer device to return the settings for 
         * @returns {DeviceSettingsObject} object with properties
         */
        deviceSettingsFor: function (sPrinterName) {
            return getDeviceSettingsFor(sPrinterName);
        },

        /**
         * search for processing attibutes for connection and subscription/license and process
         * them. The attibutes can be on any element
         * 
         * data-meadco-server value is the root url, api/v1/printhtml, api/v1/licensing will be added by the library
         * data-meadco-syncinit default is true for synchronous calls to the server, value 'false' to use asynchronous calls to the server
         * 
         * data-meadco-subscription present => cloud/on premise service, value is the subscription GUID
         * data-meadco-license present => for Windows PC service, value is the license GUID
         *
         * If data-meadco-license is present then the following additional attributes can be used:
         * 
         * data-meadco-license-revision, value is the revision number of the license
         * data-meadco-license-path,, value is the path to the license file (sxlic.mlf). A value of "warehouse" will cause the license to be downloaded from MeadCo's License Warehouse
         * 
         * Synchronous AJAX calls are deprecated in all browsers but may be useful to "quick start" use of older code. It is recommended that code is moved
         * to using asynchronous calls as soon as practical. The MeadCoScriptXJS library can assist with this as it delivers promise rather than callback based code.
         *  
         * @function useAttributes
         * @memberof MeadCoScriptXPrint
         * @example
         * 
         * <!-- an example connection to an On Premise server for ScriptX.Services -->
         * <script src="lib/meadco-scriptxservicesprintUI.min.js" 
         *      data-meadco-server="https://app.corpservices/" 
         *      data-meadco-subscription="" data-meadco-syncinit="false">
         * </script>;
         * 
         * <!-- an example connection to ScriptX.Services for Windows PC -->
         * <script src="lib/meadco-scriptxservicesUI.min.js"
         *      data-meadco-server="http://127.0.0.1:41191" 
         *      data-meadco-license="{6BC6808B-D645-40B6-AE80-E9D0825797EF}" 
         *      data-meadco-syncinit="false" 
         *      data-meadco-license-path="warehouse"
         *      data-meadco-license-revision="3">
         * </script>
         */
        useAttributes: function () {
            processAttributes();
        },

        /**
         * Specify the server to use and the subscription/license id. 
         * 
         * Attempt to connect to the defined ScriptX.Services server and obtain
         * the device settings for the default printer. This call is synchronous 
         * and therefore not recommended. Use connectAsync()
         * 
         * @function connect
         * @memberof MeadCoScriptXPrint
         * @param {string} serverUrl the 'root' url to the server (the api path will be added by the library)
         * @param {string} licenseGuid the license/subscription identifier
         */
        connect: function (serverUrl, licenseGuid) {
            connectToServer(serverUrl, licenseGuid);
        },

        /**
         * Specify the server and the subscription/license id to use on AJAX calls. No call is made in this function
         *
         * @function connectLite
         * @memberof MeadCoScriptXPrint
         * @param {string} serverUrl the 'root' url to the server (the api path will be added by the library)
         * @param {string} licenseGuid the license/subscription identifier
         */
        connectLite: function (serverUrl, licenseGuid) {
            // factory polyfill initialisation will result in a call with empty string
            // values for both arguments via printHtml.connectAsync() as it doesnt 
            // know the values so we assume a connectLite has already been called
            // and dont overwrite with empty values.
            if (arguments.length === 2 && serverUrl !== null && licenseGuid !== null && serverUrl.length > 0 && licenseGuid.length > 0)
                setServer(serverUrl, licenseGuid);
        },

        /**
         * Specify the server to use and the subscription/license id.
         *
         * Attempt to connect to the defined ScriptX.Services server and obtain
         * the device settings for the default printer. 
         *
         * @function connectAsync
         * @memberof MeadCoScriptXPrint
         * @param {string} serverUrl the 'root' url to the server (the api path will be added by the library)
         * @param {string} licenseGuid the license/subscription identifier
         * @param {function({dataObject})} resolve function to call on success, dataObject contains the device settings for the default device.
         * @param {function} reject function to call on failure
         */
        connectAsync: function (serverUrl, licenseGuid, resolve, reject) {
            connectToServerAsync(serverUrl, licenseGuid, resolve, reject);
        },

        /**
         * Test if there is a MeadCo PrintHtml API server at the url
         * 
         * @function connectTestAsync
         * @memberof MeadCoScriptXPrint
         * @param {string} serverUrl the 'root' url to the server (the api path will be added by the library)
         * @param {function} resolve function to call on success
         * @param {function({errorText})} reject function to call on failure
         */
        connectTestAsync: function (serverUrl, resolve, reject) {
            testServerConnection(serverUrl, resolve, reject);
        },

        /**
         * Cache the given device info and available printers in this static class instance
         * 
         * Used by libraries that call api/v1/printHtml/htmlPrintDefaults
         * 
         * @function connectDeviceAndPrinters
         * @memberof MeadCoScriptXPrint
         * @param {object} deviceInfo the device name and settings (papersize etc)
         * @param {array} arPrinters the names of the available printers
         */
        connectDeviceAndPrinters: function (deviceInfo, arPrinters) {
            bConnected = true;
            addOrUpdateDeviceSettings(deviceInfo);
            availablePrinters = arPrinters;
        },

        /**
         * true if the library has succesfully connected to a server.
         * 
         * @memberof MeadCoScriptXPrint
         * @property {bool} isConnected true if the library has succesfully connected to a server.
         * @readonly
         */
        get isConnected() {
            return bConnected;
        },

        /**
         * Get the list of printers availablefrom the server.
         * 
         * @property {string[]} availablePrinterNames an array of strings of the names of the available printers
         * @memberof MeadCoScriptXPrint
         * @readonly
         */
        get availablePrinterNames() {
            return availablePrinters;
        },

        /**
         * Call a /printHtml API on the server with GET
         * 
         * @function getFromServer
         * @memberof MeadCoScriptXPrint
         * @param {string} sApi the api to call on the connected server
         * @param {bool} async true for asynchronous call, false for synchronous 
         * @param {function} onSuccess function to call on success
         * @param {function(errorText)} onFail function to call on failure
         */
        getFromServer: getFromServer,

        /**
         * Post a request to the server to print some html and monitor the print job 
         * to completion. If the server prints to file then the file is opened for the user (in a new window)
         * 
         * @function printHtml
         * @memberof MeadCoScriptXPrint

         * @param {ContentType} contentType enum type of content given (html snippet, url)
         * @param {string} content the content - a url, html snippet or complete html
         * @param {object} htmlPrintSettings the html settings to use such as headers and footers, device settings (printer to use, copies etc) are taken from this static 
         * @param {function({string})} fnDone function to call when printing complete (and output returned), arg is null on no error, else error message.
         * @param {function(status,sInformation,data)} fnProgress function to call when job status is updated
         * @param {any} data object to give pass to fnCallback
         * @return {boolean} - true if a print was started (otherwise an error will be thrown)
         */
        printHtml: printHtmlAtServer,

        /**
         * Post a request to the server to print some html and monitor the print job 
         * to completion. If the server prints to file then the file is opened for the user (in a new window)
         * 
         * @function printPdf
         * @memberof MeadCoScriptXPrint

         * @param {string} document full url to the pdf document to be printed
         * @param {object} pdfPrintSettings the settings to use such as rotation, scaling. device settings (printer to use, copies etc) are taken from this static
         * @param {function({string})} fnDone function to call when printing complete (and output returned), arg is null on no error, else error message.
         * @param {function(status,sInformation,data)} fnProgress function to call when job status is updated
         * @param {any} data object to give pass to fnCallback
         * @return {boolean} - true if a print was started (otherwise an error will be thrown)
         */
        printPdf: printPdfAtServer,

        /**
         * Extract the error text from jQuery AJAX response
         * 
         * @function parseAjaxError
         * @memberof MeadCoScriptXPrint
         * 
         * @param {string} logText The lead-in text for a console.log entry
         * @param {object} jqXhr jQuery ajax header
         * @param {string} textStatus textStatus result determined by jQuery
         * @param {string} errorThrown The server exception dewtermined by jQuery
         * @returns {string} The error text to display
         */
        parseAjaxError: function (logText, jqXhr, textStatus, errorThrown) {
            return MeadCo.parseAjaxError(logText, jqXhr, textStatus, errorThrown);
        },

        /**
         * 'derived' classes call this function to report errors, will either throw or report depending on 
         * value of onErrorAction.
         * 
         * @memberof MeadCoScriptXPrint
         * @function reportError 
         * @param {string} errorTxt the error text to display
         * 
         */
        reportError: function (errorTxt) {
            MeadCo.error("ReportError: " + errorTxt);
            switch (errorAction) {
                case enumErrorAction.REPORT:
                    MeadCo.ScriptX.Print.reportServerError(errorTxt);
                    break;

                case enumErrorAction.THROW:
                    throw new Error(errorTxt);
            }
        },

        /**
         * overridable function for reporting an error. 'derived' classes call this
         * function to report errors.
         * 
         * @memberof MeadCoScriptXPrint
         * @function reportServerError 
         * @param {string} errorTxt the error text to display
         * 
         * ```js
         * // overload cloud print library report error
         * MeadCo.ScriptX.Print.reportServerError = function (errorTxt) {
         *    app.Messages.PrintErrorBox(errorTxt);
         * }
         * ```
         */
        reportServerError: function (errorTxt) {
            alert("There was an error in the printing service\n\n" + errorTxt);
        },

        /**
         * overridable function for reporting an implementation isnt available. 'derived' classes call this
         * function to report functions that are not yet implemented.
         * 
         * @memberof MeadCoScriptXPrint
         * @function reportFeatureNotImplemented
         * @param {string} featureDescription descriptn of the feature that isnt available
         * 
         * ```js
         * // overload cloud print library report error
         * MeadCo.ScriptX.Print.reportFeatureNotImplemented = function (featureDescription) {
         *   app.Messages.PrintErrorBox(featureDescription + " is not available yet with the ScriptX.Services.\n\nThis feature will be implemented soon.");
         * }
         * ```
         */
        reportFeatureNotImplemented: function (featureDescription) {
            MeadCo.log("Call to not implemented: " + featureDescription);
            alert(featureDescription + "\n\nis not available.");
        },

        /**
         * The list of jobs currently active at the server for this client
         * 
         * @memberof MeadCoScriptXPrint
         * @property {object[]} queue array of jobs 
         * @readonly
         */
        get queue() {
            return activePrintQueue;
        },

        /**
         * The number of jobs there are actgive at the server for this client
         * (same as MeadCo.ScriptX.Print.queue.length)
         * 
         * @memberof MeadCoScriptXPrint
         * @property {int} activeJobs the number of jobs
         * @readonly
         */
        get activeJobs() {
            return jobCount();
        },

        /**
         * Make sure that spooling status is locked active while asynchronous UI that may start
         * printing is displayed by placing a lock on the queue.
         * 
         * @memberof MeadCoScriptXPrint
         * @function ensureSpoolingStatus
         * @returns {object} a fake job to lock the spooling status on
         * 
         * @example
         * var lock = MeadCo.ScriptX.Print.ensureSpoolingStatus
         * ShowAsyncUI(function() {
         *  MeadCo.ScriptX.Print.freeSpoolStatus(lock);
         * });
         */
        ensureSpoolingStatus: function () {
            var lock = { jobIdentifier: Date.now(), printerName: "ensureJobsPrinter", jobName: "null Job" };
            queueJob(lock);
            return lock;
        },

        /**
         * Remove a lock on the queue that was created by a call to ensureSpoolingStatus().
         * 
         * @memberof MeadCoScriptXPrint
         * @function freeSpoolStatus
         * @param {object} lock the lock object returned by ensureSpoolingStatus()
         */
        freeSpoolStatus: function (lock) {
            removeJob(lock.jobIdentifier);
        },

        /**
         * Get if print is still 'spooling'.still queued at the server
         * 
         * @memberof MeadCoScriptXPrint
         * @property {bool} isSpooling
         * @readonly
         */
        get isSpooling() {
            return jobCount() > 0;
        },

        /**
         * Start (asynchronous) monitor to observe until no more job spooling/waiting at the server
         * then call the given callback function
         * 
         * @memberof MeadCoScriptXPrint
         * @function waitForSpoolingComplete
         * @param {int} iTimeout wait until complete or timeout (in ms) -1 => infinite
         * @param {function({bool})} fnComplete callback function, arg is true if all jobs complete
         */
        waitForSpoolingComplete: function (iTimeout, fnComplete) {
            MeadCo.log("Started WaitForSpoolingComplete(" + iTimeout + ")");
            if (typeof fnComplete !== "function") {
                throw "WaitForSpoolingComplete requires a completion callback";
            }

            var timerId;
            var startTime = Date.now();
            var interval = 250;

            var intervalId = window.setInterval(function () {
                if (jobCount() === 0) {
                    MeadCo.log("WaitForSpoolingComplete - complete");
                    window.clearInterval(intervalId);
                    fnComplete(true);
                } else {
                    if (iTimeout >= 0 && Date.now() - startTime > iTimeout) {
                        MeadCo.log("WaitForSpoolingComplete - timeout");
                        window.clearInterval(intervalId);
                        fnComplete(jobCount() === 0);
                    }
                }
            }, interval);
        }
    };

});

/*!
 * MeadCo.ScriptX.Print (support for modern browsers and IE 11) JS client library
 * Copyright 2017-2018 Mead & Company. All rights reserved.
 * https://github.com/MeadCo/ScriptX.Print.Client
 *
 * Released under the MIT license
 */

; (function (name, definition) {
    extendMeadCoNamespace(name, definition);
})('MeadCo.ScriptX.Print', function () {
    // module version and the api we are coded for
    var version = "1.4.8.0";
    var apiLocation = "v1/printHtml";

    var printerName = "";
    var deviceSettings = {};
    var module = this;

    var activePrintQueue = []; // current job queue

    var server = ""; // url to the server, server is CORS restricted
    var licenseGuid = "";
    var bConnected = false;

    var bDoneAuto = false;

    var availablePrinters = [];

    var enumContentType = {
        URL: 1, // the url will be downloaded and printed
        HTML: 2, // the passed string is assumed to be a complete html document .. <html>..</html>
        INNERTHTML: 4 // the passed string is a complete html document but missing the html tags
    };

    var enumResponseStatus = {
        QUEUEDTODEVICE: 1,
        QUEUEDTOFILE: 2,
        SOFTERROR: 3,
        OK: 4
    };

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

    var enumDuplex = {
        DEFAULT: 0,
        SIMPLEX: 1,
        VERTICAL: 2,
        HORIZONTAL: 3
    }

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
                var fnCallBack = data.fnNotify;
                if (typeof fnCallBack !== "function")
                    data.fnNotify = activePrintQueue[i].fnNotify;

                if (typeof data.fnNotify === "function" && (data.status === enumResponseStatus.QUEUEDTOFILE || data.status !== activePrintQueue[i].status)) {
                    data.fnNotify(data);
                }

                activePrintQueue[i] = data;
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

    // call api on server to print the content
    //
    // contentType - enum type of content given (html snippet, url)
    // content - string
    // htmlPrintSettings - html settings to use, the function will use device settings for the current print
    // fnDone(errorXhr) - function called when printing complete (and output returned), arg is null on no error.
    // fnNotify(data) - callback when job associated with this print is updated (data is server result)
    // fnCallback(status,sInformation,data) - callback when job status is updated 
    // data - date to give to fnCallback
    //
    function printHtmlAtServer(contentType, content, htmlPrintSettings, fnDone, fnNotify, fnCallback, data) {
        MeadCo.log("started MeadCo.ScriptX.Print.print.printHtmlAtServer() Type: " + contentType + ", printerName: " + printerName);
        var devInfo;

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
            OnProgress: fnCallback,
            UserData: data
        }

        return printAtServer(requestData,
        {
            fail: function (jqXhr, textStatus, errorThrown) {
                progress(requestData, enumPrintStatus.ERROR, errorThrown);
                MeadCo.ScriptX.Print.reportServerError(errorThrown);
                if (typeof fnDone === "function") {
                    fnDone(jqXhr);
                }
            },

            queuedToFile: function (data) {
                MeadCo.log("default handler on queued to file response");
                progress(requestData, enumPrintStatus.QUEUED);

                if (typeof fnNotify === "function") {
                    data.fnNotify = fnNotify;
                    updateJob(data);
                }

                monitorJob(requestData, data.jobIdentifier,
                    -1,
                    function (data) {
                        if (data != null) {
                            MeadCo.log("Will download printed file");
                            progress(requestData, enumPrintStatus.COMPLETED);
                            window.open(server + "/download/" + data.jobIdentifier, "_self");
                        }

                        if (typeof fnDone === "function") {
                            fnDone(data != null ? "Server error" : null);
                        }
                    });
            },

            queuedToDevice: function (data) {
                progress(requestData, enumPrintStatus.QUEUED);
                MeadCo.log("print was queued to device");

                if (typeof fnNotify === "function") {
                    data.fnNotify = fnNotify;
                    updateJob(data);
                }

                monitorJob(requestData, data.jobIdentifier,
                    -1,
                    function (data) {
                        if (data != null) {
                            progress(requestData, enumPrintStatus.COMPLETED);
                        }

                        if (typeof fnDone === "function") {
                            fnDone(data != null ? "Server error" : null);
                        }
                    });
            },

            softError: function (data) {
                progress(requestData, enumPrintStatus.ERROR);
                MeadCo.log("print has soft error");
            },

            ok: function (data) {
                progress(requestData, enumPrintStatus.COMPLETED);
                MeadCo.log("printed ok, no further information");
                if (typeof fnNotify === "function") {
                    data.fnNotify = fnNotify;
                    updateJob(data);
                }
                if (typeof fnDone === "function") {
                    fnDone(null);
                }
            }
        });
    };

    function setServer(serverUrl, clientLicenseGuid) {
        if (serverUrl.length > 0) {
            MeadCo.log("Print server requested: " + serverUrl + " => " + MeadCo.makeApiEndPoint(serverUrl, apiLocation) + " with license: " + clientLicenseGuid);
            server = MeadCo.makeApiEndPoint(serverUrl, apiLocation);
            licenseGuid = clientLicenseGuid;
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
                        async: true,
                    }).done(function (data) {
                        resolve(data);
                    })
                    .fail(function (jqXhr, textStatus, errorThrown) {
                        MeadCo.log("**warning: failure in MeadCo.ScriptX.Print.testServerConnection: [" +
                            textStatus +
                            "], [" +
                            errorThrown +
                            "], [" +
                            jqXhr.responseText +
                            "]");

                        if (typeof jqXhr.responseText !== "undefined") {
                            errorThrown = jqXhr.responseText;
                        }

                        if (errorThrown === "") {
                            errorThrown = "Unknown server or network error";
                        }
                        if (typeof reject == "function")
                            reject(errorThrown);
                    });
            }
        }
    }

    function printAtServer(requestData, responseInterface) {

        if (server.length <= 0) {
            throw new Error("MeadCo.ScriptX.Print : print server URL is not set or is invalid");
        }

        var fakeJob = {
            jobIdentifier: Date.now(),
            printerName: requestData.Device.printerName,
            jobName: "Job starting"
        };


        if (module.jQuery) {
            MeadCo.log(".ajax() post to: " + server);
            queueJob(fakeJob); // essentially a lock on the queue to stop it looking empty while we await the result
            module.jQuery.ajax(server + "/print",
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
                            responseInterface.softError(data);
                            break;

                        case enumResponseStatus.OK:
                            responseInterface.ok(data);
                            break;
                    }
                })
                .fail(function (jqXhr, textStatus, errorThrown) {
                    MeadCo.log("Fail response from server: [" +
                        textStatus +
                        "], [" +
                        errorThrown +
                        "], [" +
                        jqXhr.responseText +
                        "]");
                    removeJob(fakeJob.jobIdentifier);
                    if (typeof jqXhr.responseText !== "undefined") {
                        errorThrown = jqXhr.responseText;
                    }

                    if (errorThrown === "") {
                        errorThrown = "Unknown server or network error";
                    }

                    if (typeof responseInterface.fail === "function") {
                        responseInterface.fail(jqXhr, textStatus, errorThrown);
                    }
                });
            return true;
        } else {
            throw new Error("MeadCo.ScriptX.Print : no known ajax helper available");
        }
    }

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
                    MeadCo.log("**warning: failure in MeadCo.ScriptX.Print.getFromServer: [" +
                        textStatus +
                        "], [" +
                        errorThrown +
                        "], [" +
                        jqXhr.responseText +
                        "]");

                    if (typeof jqXhr.responseText !== "undefined") {
                        errorThrown = jqXhr.responseText;
                    }

                    if (errorThrown === "") {
                        errorThrown = "Unknown server or network error";
                    }
                    if (typeof onFail == "function")
                        onFail(errorThrown);
                });
        }
    }

    function monitorJob(requestData, jobId, timeOut, functionComplete) {
        MeadCo.log("monitorJob: " + jobId);
        var counter = 0;
        var interval = 1000;
        var bWaiting = false;
        var intervalId = window.setInterval(function () {
            if (!bWaiting) {
                MeadCo.log("Going to request status with .ajax");
                bWaiting = true;
                $.ajax(server + "/status/" + jobId,
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
                                progress(requestData, data.status, data.message);
                                updateJob(data);
                                // keep going
                                if (timeOut > 0 && (++counter * interval) > timeOut) {
                                    window.clearInterval(intervalId);
                                    MeadCo.ScriptX.Print.reportServerError("unknown failure while printing.");
                                }
                                bWaiting = false;
                                break;

                            case enumPrintStatus.ERROR:
                            case enumPrintStatus.ABANDONED:
                                MeadCo.log("error status in monitorJob so clear interval: " + intervalId);
                                progress(requestData, data.status, data.message);
                                removeJob(data);
                                window.clearInterval(intervalId);
                                MeadCo.ScriptX.Print.reportServerError("The print failed.\n\n" + data.message);
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
                        MeadCo.log("**warning: failure in MeadCo.ScriptX.Print.monitorJob: [" +
                            textStatus +
                            "], [" +
                            errorThrown +
                            "], [" +
                            jqXhr.responseText +
                            "]");

                        if (typeof jqXhr.responseText !== "undefined") {
                            errorThrown = jqXhr.responseText;
                        }

                        if (errorThrown === "") {
                            errorThrown = "Unknown server or network error";
                        }

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
        deviceSettings[data.printerName] = data;
        if (data.isDefault && printerName.length === 0) {
            printerName = data.printerName;
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
                    if (errorThrown === "") {
                        errorThrown = jqXhr.responseText;
                    }
                    else {
                        bConnected = true; // we connected but the server doesnt like us
                        errorThrown = errorThrown.toString();
                    }

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
        if (typeof sPrinterName === "string" && sPrinterName != "") {
            if (typeof deviceSettings[sPrinterName] === "undefined") {
                getDeviceSettings({
                    name: sPrinterName,
                    async: false,
                    fail: function (eTxt) { MeadCo.ScriptX.Print.reportServerError(eTxt); }
                });
            }

            return deviceSettings[sPrinterName];
        }

        return {}
    }

    function processAttributes() {
        MeadCo.log("MeadCo.ScriptX.Print ... looking for auto connect: " + bDoneAuto);
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
                    console.error("Unable to auto-connect subscription - print or printHtml API not present");
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
                    console.error("Unable to auto-connect client license - print or printHtml or license API not present");
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
        MeadCo.log("**** warning :: no jQuery");
    }

    MeadCo.log("MeadCo.ScriptX.Print " + version + " loaded.");

    //////////////////////////////////////////////////
    // public API
    return {
        ContentType: enumContentType,

        ResponseType: enumResponseStatus,

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
                            fail: function (eTxt) { MeadCo.ScriptX.Print.reportServerError(eTxt); }
                        });
                    } else {
                        printerName = deviceRequest;
                    }
                } else {
                    getDeviceSettings(deviceRequest);
                }
            }
        },

        get version() {
            return version;
        },

        set deviceSettings(settings) {
            addOrUpdateDeviceSettings(settings);
        },

        get deviceSettings() {
            return printerName !== "" ? deviceSettings[printerName] : {};
        },

        deviceSettingsFor: function (sPrinterName) {
            return getDeviceSettingsFor(sPrinterName);
        },

        useAttributes: function () {
            processAttributes();
        },

        connect: function (serverUrl, licenseGuid) {
            connectToServer(serverUrl, licenseGuid);
        },

        connectLite: function (serverUrl, licenseGuid) {
            // factory polyfill initialisation will result call with empty string
            // values for both arguments via printHtml.connectAsync() as it doesnt 
            // know the values so we assume a connectLite has already been called
            // and dont overwrite with empty values.
            if (arguments.length === 2 && serverUrl.length > 0 && licenseGuid.length > 0)
                setServer(serverUrl, licenseGuid);
        },

        connectAsync: function (serverUrl, licenseGuid, resolve, reject) {
            connectToServerAsync(serverUrl, licenseGuid, resolve, reject);
        },

        connectTestAsync: function (serverUrl, resolve, reject) {
            testServerConnection(serverUrl, resolve, reject);
        },

        connectDeviceAndPrinters: function (deviceInfo, arPrinters) {
            bConnected = true;
            addOrUpdateDeviceSettings(deviceInfo);
            availablePrinters = arPrinters;
        },

        get isConnected() {
            return bConnected;
        },

        get availablePrinterNames() {
            return availablePrinters;
        },

        getFromServer: getFromServer,

        printHtml: printHtmlAtServer,

        // overridable function for reporting an error.
        reportServerError: function (errorThrown) {
            alert("There was an error in the printing service\n\n" + errorThrown);
        },

        // overridable function for reporting feature isnt available.
        reportFeatureNotImplemented: function (featureDescription) {
            MeadCo.log("Call to not implemented: " + featureDescription);
            alert(featureDescription + "\n\nis not available.");
        },

        get queue() {
            return activePrintQueue;
        },

        get activeJobs() {
            return jobCount();
        },

        ensureSpoolingStatus: function () {
            var lock = { jobIdentifier: Date.now() };
            queueJob(lock);
            return lock;
        },

        freeSpoolStatus: function (lock) {
            removeJob(lock.jobIdentifier);
        },

        isSpooling: function () {
            return jobCount() > 0;
        },

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

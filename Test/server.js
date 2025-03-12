const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const { exec } = require('child_process');

const PORT = 41191; // standard ScriptX.Services 4WPC port

// Define the constants and server from your original file
const mimeTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
};

// Basic in-memory storage to simulate service state
const serviceState = {
    printers: [
        { name: "Microsoft Print to PDF", isDefault: true },
        { name: "Microsoft XPS Document Writer", isDefault: false }
    ],
    printJobs: [],
    nextJobId: 1,
    licenses: []
};

// Function to parse JSON request body
const parseRequestBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', (error) => {
            reject(error);
        });
    });
};

// Function to decode Basic Authorization header
const decodeBasicAuthHeader = (req) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return null;
    }
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    return credentials.slice(0, -1); // Assuming the credentials are the GUID, remove the final :
};

// Helper to add CORS headers to response
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization,X-Meadroid-Path');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
}

// Helper to send JSON responses
function sendJsonResponse(res, statusCode, data) {
    setCorsHeaders(res);
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}

// Create routes based on ScriptX Services API
const routes = {
    // Printer API
    "/api/v1/deviceinfo/printers": {
        GET: (req, res) => {
            sendJsonResponse(res, 200, serviceState.printers);
        }
    },
    "/api/v1/deviceinfo/printers/default": {
        GET: (req, res) => {
            const defaultPrinter = serviceState.printers.find(p => p.isDefault);
            if (defaultPrinter) {
                sendJsonResponse(res, 200, defaultPrinter);
            } else {
                sendJsonResponse(res, 404, "Default printer not found" );
            }
        }
    },
    "/api/v1/printHtml/htmlPrintDefaults/": {
        GET: (req, res) => {
            const defaultPrinter = serviceState.printers.find(p => p.isDefault);
            if (defaultPrinter) {
                const params = url.parse(req.url, true).query;
                const units = params.units;

                console.log("GET htmlPrintDefaults: ", params);
                sendJsonResponse(res, 200, {
                    "settings": {
                        "header": "page header",
                        "footer": "page footer",
                        "headerFooterFont": "Arial",
                        "page": {
                            "orientation": 0,
                            "units": units,
                            "margins": {
                                "left": "5",
                                "top": "5",
                                "bottom": "5",
                                "right": "5"
                            }
                        },
                        "viewScale": 0,
                        "printBackgroundColorsAndImages": 0,
                        "pageRange": "",
                        "printingPass": 0,
                        "extraHeadersAndFooters": {
                            "allPagesHeader": "",
                            "allPagesFooter": "",
                            "firstPageHeader": "",
                            "firstPageFooter": "",
                            "extraFirstPageFooter": "",
                            "allHeaderHeight": 0,
                            "allFooterHeight": 0,
                            "firstHeaderHeight": 0,
                            "firstFooterHeight": 0,
                            "extraFirstFooterHeight": 0
                        }
                    },
                    "device": {
                        "printerName": defaultPrinter.name,
                        "paperSizeName": "A4",
                        "paperSourceName": "",
                        "collate": 0,
                        "copies": 0,
                        "duplex": 0,
                        "units": 0,
                        "paperPageSize": {
                            "width": 197,
                            "height": 500
                        },
                        "unprintableMargins": {
                            "left": "10",
                            "top": "10",
                            "bottom": "10",
                            "right": "10"
                        },
                        "status": 0,
                        "port": "LPT1:",
                        "attributes": 0,
                        "serverName": "",
                        "shareName": "",
                        "location": "",
                        "isLocal": true,
                        "isNetwork": false,
                        "isShared": false,
                        "isDefault": true,
                        "bins": [
                            ""
                        ],
                        "forms": [
                            "A4",
                            "Letter", ,
                            "Legal",
                            "Executive",
                            "A3",
                            "A5",
                            "B4"
                        ]
                    },
                    "availablePrinters": [
                        "Microsoft Print to PDF",
                        "Microsoft XPS Document Writer"
                    ]
                });
            } else {
                sendJsonResponse(res, 404, "Default printer not found");
            }
        }
    },
    // License API
    "/api/v1/licensing/ping": {
        GET: (req, res) => {
            console.log("GET /api/v1/licensing/ping");
            sendJsonResponse(res, 200, {
                "basicHtmlPrinting": true,
                "advancedPrinting": true,
                "enhancedFormatting": true,
                "printPdf": true,
                "printRaw": true
            });
        }
    },
    "/api/v1/licensing": {
        GET: (req, res) => {
            const guid = decodeBasicAuthHeader(req);
            if (!guid) {
                sendJsonResponse(res, 401, "Unauthorized" );
                return;
            }

            console.log("GET License: ", guid);
            const license = serviceState.licenses.find(l => l.guid == guid)

            if (!license) {
                console.warn("License not found: ", guid);
                sendJsonResponse(res, 401, "Unauthorized - unknown license");
                return;
            }

            console.log("Return license: ", license);
            sendJsonResponse(res, 200, license);
        },
        POST: async (req, res) => {
            try {
                const licenseData = await parseRequestBody(req);
                const guid = licenseData.Guid;
                console.log("POST License data: ", licenseData);
                if (!guid) {
                    sendJsonResponse(res, 400, "GUID is required");
                    return;
                }
                console.log("guid: ", guid, typeof(guid));
                serviceState.licenses.push({
                    guid: guid,
                    company: "Test Company",
                    companyHomePage: "https://www.example.com",
                    from: new Date().toISOString(),
                    to: new Date().toISOString(),
                    options: {
                        basicHtmlPrinting: true,
                        advancedPrinting: true,
                        enhancedFormatting: true,
                        printPdf: true,
                        printRaw: true
                    },
                    domains: [
                        "example.com",
                        "meadroid.com"
                    ],
                    revision: licenseData.Revision || 0
                });

                sendJsonResponse(res, 201, serviceState.licenses.find(l => l.guid === guid));
            } catch (error) {
                sendJsonResponse(res, 400, "Invalid license data");
            }
        }
    },

    // Print HTML API
    "/api/v1/print/html": {
        POST: async (req, res) => {
            try {
                const printData = await parseRequestBody(req);

                // Create a new print job
                const jobId = serviceState.nextJobId++;
                const printJob = {
                    id: jobId,
                    status: "queued",
                    content: printData.content || "Empty document",
                    printer: printData.printer || "Default Printer",
                    createdAt: new Date().toISOString(),
                    completedAt: null
                };

                serviceState.printJobs.push(printJob);

                // Simulate job processing
                setTimeout(() => {
                    const job = serviceState.printJobs.find(j => j.id === jobId);
                    if (job) {
                        job.status = "completed";
                        job.completedAt = new Date().toISOString();
                    }
                }, 2000);

                sendJsonResponse(res, 202, { jobId: jobId, status: "accepted" });
            } catch (error) {
                sendJsonResponse(res, 400, "Invalid print request data");
            }
        }
    },
    // Print job status API
    "/api/v1/print/jobs": {
        GET: (req, res) => {
            sendJsonResponse(res, 200, serviceState.printJobs);
        }
    },

    // Service description
    "/api": {
        GET: (req, res) => {
            sendJsonResponse(res, 200, {
                serviceClass: 3,
                currentAPIVersion: "1",
                serviceVersion: { major: 1, minor: 0, build: 0, revision: 0, majorRevision: 1, minorRevision: 0 },
                printHTML: true,
                printPDF: true,
                printDIRECT: true,
                availablePrinters: serviceState.printers
            });
        }
    }
};

// Helper to generate a simple GUID
function generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Create the service server
const serviceServer = http.createServer(async (req, res) => {

    // Handle preflight OPTIONS requests for CORS
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        res.writeHead(204);
        res.end();
        return;
    }

    // Parse the URL
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    console.log(`ScriptX Service API request: ${method} ${pathname}`);

    // Check if we have a route handler for this path and method
    if (routes[pathname] && routes[pathname][method]) {
        // Call the route handler
        await routes[pathname][method](req, res);
    }
    // Handle 404 for API routes
    else if (pathname.startsWith('/api/')) {
        sendJsonResponse(res, 404, "API endpoint not found");
    }
    // Serve static files for non-API routes 
    else {
        let filePath = path.join(__dirname, "test-page.html");
        if (pathname !== "/") {
            if (pathname === "/meadco-scriptx.js") {
                filePath = path.join(__dirname, "../src/meadco-scriptx.js");
            }
            else {
                if (pathname.startsWith("/scriptxprint-html/dist/dist")) {
                    filePath = path.join(__dirname, "../node_modules/scriptxprint-html/dist", pathname.substring("/scriptxprint-html/dist/dist".length));
                }
                else {
                    if (pathname.startsWith("/scriptxprint-html/dist")) {
                        filePath = path.join(__dirname, "../node_modules/scriptxprint-html/dist", pathname.substring("/scriptxprint-html/dist".length));
                    }
                    else {
                        filePath = path.join(__dirname, pathname);
                    }
                }
             }
        }

        const extname = String(path.extname(filePath)).toLowerCase();
        const contentType = mimeTypes[extname] || "application/octet-stream";

        console.log("Server will return content of: " + filePath);

        fs.readFile(filePath, (err, data) => {
            setCorsHeaders(res);
            if (err) {
                if (pathname != "/favicon.ico") // its ok to not find the favicon
                    console.error(err);
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Error loading page");
            } else {
                res.writeHead(200, { "Content-Type": contentType });
                res.end(data);
            }
        });
    }
});

// Modify the exported module to include the service server
module.exports = {
    start: () => new Promise((resolve) => {
        serviceServer.listen(PORT, () => {
            console.log(`ScriptX Service API running at http://localhost:${PORT}`);
            resolve();
        });
    }),
    stop: () => new Promise((resolve) => {
        serviceServer.close(() => {
            console.log("ScriptX Service API stopped");
            resolve();
        });
    }),
    debug: () => new Promise((resolve) => {
        console.log(routes);
        resolve();
    }),
    port: PORT
};

if (require.main === module) {
    module.exports.start().then(() => {
        console.log(`Server running on port ${PORT}`);
    });
}




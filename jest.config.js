module.exports = {
    preset: "jest-puppeteer",
    testEnvironment: "jest-environment-puppeteer",
    testTimeout: 30000, // Adjust if needed for slow tests
    reporters: [
        "default",
        ["jest-html-reporter", {
            "pageTitle": "Test Report",
            "outputPath": "./TestResults/test-report.html",
            "includeFailureMsg": true,
            "includeConsoleLog": true
        }]
    ]
};

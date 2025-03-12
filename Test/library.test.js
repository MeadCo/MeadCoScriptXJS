const server = require("./server");
const packageDescription = require("../package.json");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe("Library Tests with no attribute initialisation", () => {
    beforeAll(async () => {
        await server.start();
        await page.goto("http://localhost:" + server.port + "/test-page.html");
    });

    afterAll(async () => {
        await server.stop();
    });

    test("Library is expected version", async () => {
        const result = await page.evaluate(() => {
            return window.MeadCo.ScriptX.LibVersion;
        });

        expect(result).toBe(packageDescription.version);
    });

    test("Library fails to synchronously initialise as connection was not defined", async () => {
        const result = await page.evaluate(() => {
            return window.MeadCo.ScriptX.Init();
        });

        expect(result).toBeFalsy();
    });

    test("Library programatic asynchronous initialisation", async () => {
        const result = await page.evaluate(async () => {
            return await window.MeadCo.ScriptX.StartAsync({
                                                  serviceConnection: {
                                                  serverUrl: "http://127.0.0.1:41191",
                                                  licenseGuid: "{5091E665-8916-4D21-996E-00A2DE5DE416}",
                                                  licenseRevision: 0,
                                                  licensePath: "warehouse"
                                              },
                                              printSettings: {
                                                  header: "Page &p of &P",
                                                  footer: "&D",
                                                  pageSetup: {
                                                      orientation: "landscape"
                                                  }
                                              }
            });
        });

        console.log(result);
        expect(result.connection).toBe(2);
        expect(result.license.guid).toBe("{5091E665-8916-4D21-996E-00A2DE5DE416}");
    });
});

describe("Library Tests with asynchronous attribute based initialisation", () => {
    beforeAll(async () => {
        await server.start();
        await page.goto("http://localhost:" + server.port + "/test-page2.html");
    });

    afterAll(async () => {
        await server.stop();
    });

    test("Library is expected version", async () => {
        const result = await page.evaluate(() => {
            return window.MeadCo.ScriptX.LibVersion;
        });

        expect(result).toBe(packageDescription.version);
    });

    test("Library asynchronously initialises with a connection", async () => {
        const result = await page.evaluate(async () => {
            return await window.MeadCo.ScriptX.InitAsync();
        });

        expect(result).toBe(2);
    });

    test("Correct ScriptX version", async () => {
        const result = await page.evaluate(() => {
            return window.MeadCo.ScriptX.Version();
        });

        expect(result).toBe("8.3.0.0");
    });

    test("Correct IsVersion", async () => {
        const result = await page.evaluate(() => {
            return window.MeadCo.ScriptX.IsVersion("8.3.0.0");
        });

        expect(result).toBeTruthy();
    });

    test("Connect is to services", async () => {
        const result = await page.evaluate(async () => {
            return window.MeadCo.ScriptX.IsServices();
        });
        expect(result).toBeTruthy();
    });

    test("Services version (test server) is correct", async () => {
        const result = await page.evaluate(async () => {
            return window.MeadCo.ScriptX.ServicesVersion();
        });

        console.log(result);
        expect(result).toBe("1.16.1.0");
    });

});
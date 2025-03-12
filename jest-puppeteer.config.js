module.exports = {
    launch: {
        headless: true, // Set to false to see the browser UI during tests
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    },
    browserContext: "default"
};

const server = require('./server.js');

// Start the server
let serverInstance = null;

async function startServer() {
    await server.start();
    console.log(`Server running on port ${server.port}`);
    serverInstance = server;
    return server;
}

async function stopServer() {
    if (serverInstance) {
        await serverInstance.stop();
        console.log('Server has been stopped');
    }
}

async function debugServer() {
    await server.debug();
}

// For command-line usage
if (require.main === module) {
    const command = process.argv[2];

    if (command === 'start') {
        startServer();
    } else if (command === 'stop') {
        stopServer();
    } else if (command === 'debug') {
        debugServer();
    } 
    else {
        console.log('Usage: node start-stop-server.js [start|stop|debug]');
    }
}

module.exports = { startServer, stopServer };

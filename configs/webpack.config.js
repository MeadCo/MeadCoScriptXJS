const path = require('path');

module.exports = {
    // Set production mode to enable built-in optimizations (minification, tree shaking, etc.)
    mode: 'production',

    // Entry point of your application
    entry: './src/meadco-scriptx.js',

    // Output configuration
    output: {
        filename: 'meadco-scriptx.min.js',
        path: path.resolve(__dirname, 'dist'),
    },

    // Generate a separate source map file (bundle.js.map) for easier debugging
    devtool: 'source-map',

    // Optional: Customize minimization (Webpack uses TerserPlugin by default in production mode)
    optimization: {
        minimize: true,
        // You can further customize TerserPlugin options if needed:
        // minimizer: [new TerserPlugin({ terserOptions: { /* custom options */ } })],
    },
};

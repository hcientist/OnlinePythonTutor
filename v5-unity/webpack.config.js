var webpack = require('webpack');

module.exports = {
    entry: "./js/opt-frontend.js",

    plugins: [
      // http://stackoverflow.com/questions/29080148/expose-jquery-to-real-window-object-with-webpack
      new webpack.ProvidePlugin({
        // Automtically detect jQuery and $ as free var in modules
        // and inject the jquery library
        // This is required by many jquery plugins
        jquery: "jquery",
        jQuery: "jquery",
        $: "jquery"
      })
    ],

    // some included libraries reference 'jquery', so point to it:
    resolve : {
        alias: {
            "jquery": __dirname + "/js/jquery-3.0.0.min.js",
            "$": __dirname + "/js/jquery-3.0.0.min.js",
            //"jquery": __dirname + "/js/jquery-1.8.2.min.js",
            //"$": __dirname + "/js/jquery-1.8.2.min.js",

            "$.bbq": __dirname + "/js/jquery.ba-bbq.js",
        }
    },

    output: {
        // keep output in this directory so that the server can easily
        // find images and other static assets (though it pollutes pwd)
        path: __dirname, // + "/webpack-output/",
        // TODO: use 'bundle.[hash].js' for fingerprint hashing
        // to create unique filenames for releases:
        // https://webpack.github.io/docs/long-term-caching.html
        filename: "bundle.js",
        sourceMapFilename: "[file].map",
    },

    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" },
            { test: /\.(png|jpg)$/, loader: 'file-loader' }
        ]
    },

    devtool: 'source-map', // VERY important to have source maps for debugging
};

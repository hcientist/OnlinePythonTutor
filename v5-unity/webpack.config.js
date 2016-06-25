var webpack = require('webpack');

module.exports = {
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
            "jquery": __dirname + "/js/lib/jquery-3.0.0.min.js",
            "$": __dirname + "/js/lib/jquery-3.0.0.min.js",
            "$.bbq": __dirname + "/js/lib/jquery.ba-bbq.js",
        }
    },

    entry: {
        'opt-frontend': "./js/opt-frontend.ts",
        'opt-live': "./js/opt-live.ts",
        'iframe-embed': "./js/iframe-embed.ts",
    },

    output: {
        path: __dirname + "/build/",
        // TODO: use 'bundle.[hash].js' for fingerprint hashing
        // to create unique filenames for releases:
        // https://webpack.github.io/docs/long-term-caching.html
        filename: "[name].bundle.js",
        sourceMapFilename: "[file].map",
    },

    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" }, // CSS
            { test: /\.(png|jpg)$/, loader: 'url-loader' }, // images
            { test: /\.ts$/, loader: 'ts-loader' } // TypeScript
        ]
    },

    devtool: 'source-map', // source maps are very important to ease debugging
};

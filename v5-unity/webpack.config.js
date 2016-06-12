module.exports = {
    entry: "./js/opt-frontend.js",

    // some included libraries reference 'jquery', so point to it:
    resolve : {
        alias: {
            "jquery": __dirname + "/js/jquery-1.8.2.min.js",
            "$": __dirname + "/js/jquery-1.8.2.min.js",
            "$.bbq": __dirname + "/js/jquery.ba-bbq.min.js",
        }
    },

    output: {
        path: __dirname + "/webpack-output/",
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

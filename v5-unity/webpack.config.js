var webpack = require('webpack');
var WebpackOnBuildPlugin = require('on-build-webpack');
var exec = require('child_process').exec;

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
      }),

      // run a micro frontend regression test after every webpack build
      // to sanity-check
      new WebpackOnBuildPlugin(function(stats) {
        console.log("\n");
        exec("cd ../tests/frontend-regression-tests/ && make micro", (error, stdout, stderr) => {
          console.log(stdout);
          if (stderr) {
            console.log(`Test stderr: ${stderr}`);
          }
        });
      }),
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
        'visualize': "./js/visualize.ts",
        'opt-live': "./js/opt-live.ts",
        'iframe-embed': "./js/iframe-embed.ts",
        'embedding-demo': "./js/embedding-demo.ts",
        'index': "./js/index.ts",
        'composingprograms': "./js/composingprograms.ts",
        'csc108h': "./js/csc108h.ts",
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

    //devtool: 'source-map', // source maps are very important to ease debugging
    // nix this, and use the command-line option "--devtool sourcemap" to create
    // source maps in a debugging build
};

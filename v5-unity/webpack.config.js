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
      //
      // TODO: get frontend regression tests working again before re-enabling them:
      /*
      new WebpackOnBuildPlugin(function(stats) {
        console.log("\n");
        exec("cd ../tests/frontend-regression-tests/ && make micro", (error, stdout, stderr) => {
          console.log(stdout);
          if (stderr) {
            console.log(`Test stderr: ${stderr}`);
          }
        });
      }),
      */
    ],

    // some included libraries reference 'jquery', so point to it:
    resolve : {
        // VERY IMPORTANT to put .ts *FIRST* (or as the only item) in
        // this list (if you're going to list other stuff), so that module
        // names first resolve to .ts files
        //
        // this way, you can import modules like this without the .ts
        // extension:
        // import {ExecutionVisualizer} from './pytutor';
        //
        // for some reason, you're not allowed to put explicit filename
        // extensions in newer versions of webpack, so we need this line:
        extensions: ['.ts', '.js', '.css'],

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
        'index': "./js/index.ts",
        'composingprograms': "./js/composingprograms.ts",
        'csc108h': "./js/csc108h.ts",
        'pytutor-embed': "./js/pytutor-embed.ts",
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
            { test: /\.css$/, loader: "style-loader!css-loader" }, // CSS
            { test: /\.(png|jpg)$/, loader: 'url-loader' }, // images
            { test: /\.ts$/, loader: 'ts-loader' } // TypeScript
        ]
    },

    //devtool: 'source-map', // source maps are very important to ease debugging
    // nix this, and use the command-line option "--devtool sourcemap" to create
    // source maps in a debugging build
};

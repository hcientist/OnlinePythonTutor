Online Python Tutor v5 "unity" -- the goal for this version is to
significantly clean up, modernize, and modularize the OPT codebase to
ease future development.

Specifically, this version of the codebase improves upon the older v3/
code by using TypeScript and refactoring the code for better modularity.
To see how, compare the TypeScript files found here in js/ and the older
messier JavaScript files in ../v3/js/

The main caveat, though, is that there's the extra complexity of a
Webpack- and TypeScript-based compilation step. See these files for more
info:

- package.json      <-- Node.js dependencies for npm
- package-lock.json <-- see https://docs.npmjs.com/files/package-locks
- webpack.config.js <-- Webpack configuration file (works on webpack versions under v4)

Note that this directory (like v3/) contains only the web frontend code
and the Python execution backend (mainly in pg_logger.py). For the
backends that run *other* (i.e., non-Python) languages, see
../v4-cokapi/

---
After everything has been installed properly (see below):

To start the Webpack automatic file watching and code compilation
environment, run:

  npm run webpack


To start the webserver, run:

  npm start

then visit here to load an HTML page in your browser:
  http://localhost:8003/visualize.html

To make a production (minified, cache-busted) build for deployment, run:

  npm run production-build


(TODO: the --optimize-minimize doesn't seem to work right now; dunno why, ergh)
---
This workflow was tested on 2017-02-11 with these versions of major tools:

typescript 2.1.6
webpack 2.2.1


UPDATE: it was tested on 2018-05-26 with:

$ webpack -v
3.11.0

$ tsc -v
Version 2.8.3

------

[instructions last updated on 2018-05-26 ... ergh these instructions
get outdated so quickly since the npm ecosystem is so unstable and moves
so fast ...]

To get started, install:

1) Node.js / npm
2) Global npm dependency installs (run these commands in this directory):

  sudo npm install webpack@v3.11.0 -g # DON'T USE NEWER WEBPACK since it won't work with my webpack.config.js file, ergh
  sudo npm install webpack-dev-server -g
  sudo npm install -g typescript
  sudo npm install -g tsd

3) Run "npm install" in this directory to install node dependencies
4) Run "tsd install" in this directory to install TypeScript definition files

5) do this near the end, i think
  npm link webpack            # link to the local node_modules/ dir
  npm link typescript         # link to the local node_modules/ dir

6) Install bottle.py to run the local webserver (I suppose we could use node too, but oh wells!)
  pip install bottle # maybe needed sudo

see package.json for specific version dependencies, such as:
    "ts-loader": "^3.5.0",
otherwise stuff doesn't play well together, eeeek dependency hell!

======
History:

I started porting v3/ over to v5-unity/ on 2016-06-12 since the headache
of manually maintaining so many JS/CSS files and their intricate
dependencies was starting to get out of hand ... i've waited for years
to port to a more sustainable and modern development setup ...

I decided to go with Webpack for the module system and to upgrade the
appropriate versions of libraries to match, without breaking crufty
legacy code (hopefully)


======
Older (possibly-outdated) notes from mid-2016:

Requires these global installations:
- Node.js / npm
- webpack: http://webpack.github.io/ and webpack-dev-server
  sudo npm install webpack -g
  sudo npm install webpack-dev-server -g

  [you might need to install webpack locally (without the -g) ... weird]

If you run: webpack-dev-server --progress --colors

then your code will automatically recompile and be refreshed here:
http://localhost:8080/webpack-dev-server/visualize.html
(but this is kinda flaky, ugh)

Instead, use this to continually compile:
webpack --watch

and run the server with Bottle:
python bottle_server.py

---
Ported the code base over to TypeScript for enhanced static checking

For developing using TypeScript:
  sudo npm install -g typescript # install globally
  npm link typescript            # link to the local node_modules/ dir
  npm install tsd -g             # tsd type definitions manager
  tsd install require --save
  tsd install jQuery --save
  tsd install jquery.bbq --save
  tsd install ace --save
  tsd install qtip2 --save
  tsd install jqueryui --save
  tsd install d3 --save
  tsd install diff-match-patch --save
  tsd install jquery.simplemodal --save

  (then in the future, simply run 'tsd install' to install definition
   modules saved in tsd.json)

Currently using: Version 1.8.10

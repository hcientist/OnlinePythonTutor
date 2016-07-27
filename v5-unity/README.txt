---
Online Python Tutor v5 "unity" -- the goal for this version is to
significantly clean up, modernize, and modularize the OPT codebase to
ease future development.

---

After everything has been installed properly (see below):

To start the Webpack file watching and compilation environment, run:

  npm run webpack


To start the webserver, run:

  npm start


then visit here to load an HTML page in your browser:

  http://localhost:8003/visualize.html


To make a production (minified, cache-busted) build for deployment, run:

  npm run production-build

---
History:

I started porting v3/ over to v5-unity/ on 2016-06-12 since the headache
of manually maintaining so many JS/CSS files and their intricate
dependencies was starting to get out of hand ... i've waited for years
to port to a more sustainable and modern development setup ...

I decided to go with Webpack for the module system and to upgrade the
appropriate versions of libraries to match, without breaking crufty
legacy code (hopefully)

---
To get started, install:

1.) Node.js / npm
2.) Global dependency installs:

  sudo npm install webpack -g
  sudo npm install webpack-dev-server -g
  sudo npm install -g typescript
  sudo npm install -g tsd

3.) Run "npm install" in this directory to install node dependencies

4.) Run "tsd install" in this directory to install TypeScript definition files

5.) Bottle.py for the local webserver

  sudo pip install bottle

6.) Follow ../tests/frontend-regression-tests/README.txt to install
    dependencies for visual regression testing

======
Older notes:

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

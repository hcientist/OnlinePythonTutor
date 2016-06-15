---
Online Python Tutor v5 "unity" -- the goal for this version is to
significantly clean up, modernize, and modularize the OPT codebase to
ease future development.

I started porting v3/ over to v5-unity/ on 2016-06-12 since the headache
of manually maintaining so many JS/CSS files and their intricate
dependencies was starting to get out of hand ... i've waited for years
to port to a more sustainable and modern development setup ...

I decided to go with Webpack for the module system and to upgrade the
appropriate versions of libraries to match, without breaking crufty
legacy code (hopefully)

---

Requires these global installations:
- Node.js / npm
- webpack: http://webpack.github.io/ and webpack-dev-server
  npm install webpack -g
  npm install webpack-dev-server -g

If you run: webpack-dev-server --progress --colors

then your code will automatically recompile and be refreshed here:
http://localhost:8080/webpack-dev-server/visualize.html
(but this is kinda flaky, ugh)

Instead, use this to continually compile:
webpack --watch

and run the server with Bottle:
python bottle_server.py


to start using npm:

  npm start
  npm run webpack

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

Currenly using: Version 1.8.10

---

https://github.com/petehunt/webpack-howto

    'webpack' for building once for development
    'webpack -p' for building once for production (minification)
    'webpack --watch' for continuous incremental build in development (fast!)
    'webpack -d' to include source maps

TODO: always do webpack -p for deploy to production, and add a unique hash

TODO: consider code splitting to split out common parts (e.g., libraries
and unchanging parts) from the specific frontends


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

If you run:
webpack-dev-server --progress --colors

then your code will automatically recompile and be refreshed here:
http://localhost:8080/webpack-dev-server/


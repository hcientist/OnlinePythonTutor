[ DEPRECATED as of 2018-06-09 ... instead see ../../v5-unity/tests/frontend-tests/ ]

---
We will use phantomcss.js for visual regression testing of the OPT
frontend

First install PhantomJS (e.g., for Mac) by downloading a binary:
http://phantomjs.org/download.html

and adding it to $PATH so that the 'phantomjs' executable works

Then install CasperJS globally:
sudo npm install -g casperjs

Now the 'phantomjs' and 'casperjs' commands should both work


Then install resemblejs locally:

npm install resemblejs

and make sure it appears in node_modules/ in this directory (and not in
a parent directory)

# Overview for Developers of Online Python Tutor

This document is a starting point for anyone who wants to hack on
Online Python Tutor (thereafter abbreviated as OPT).

Look at the Git history to see when this document was last updated; the more time
elapsed since that date, the more likely things are out-of-date. Please email
philip@pgbovine.net if you have questions.


## Running OPT locally on your machine

When you check out OPT from GitHub, it's configured by default to run on
Google App Engine. So download the Google App Engine [Python SDK](https://developers.google.com/appengine/downloads)
for your OS and then run:

    cd OnlinePythonTutor/
    dev_appserver.py v3/

Now if you visit http://localhost:8080/ on your browser, you should see the main OPT editor screen.

Congrats! Now you can edit your code and reload the page to test your changes. You don't need to shut down and restart
the local webserver after every edit.

The main caveat here is that Google App Engine runs Python 2.7, so you won't be able to test Python 3 locally this way.


## Overall system architecture


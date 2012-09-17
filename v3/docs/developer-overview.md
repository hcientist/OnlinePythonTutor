# Developer's Guide Overview

This document is a starting point for anyone who wants to hack on
Online Python Tutor (thereafter abbreviated as OPT). View it online at:

https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/developer-overview.md

Look at the Git history to see when this document was last updated; the more time
elapsed since that date, the more likely things are out-of-date. Please email
philip@pgbovine.net if you have questions.

And please excuse the sloppy writing; I'm not trying to win any style awards here :)


## Running OPT locally on your machine

When you check out OPT from GitHub, it's configured by default to run on
Google App Engine. So download the Google App Engine [Python SDK](https://developers.google.com/appengine/downloads)
for your OS and then run:

    cd OnlinePythonTutor/
    dev_appserver.py v3/

Now if you visit http://localhost:8080/ on your browser, you should see the main OPT editor screen.

Congrats! Now you can edit any code in `OnlinePythonTutor/v3/` and reload the page to test your changes.
You don't need to shut down and restart the local webserver after every edit.

btw, using the default configuration, http://localhost:8080/ is actually loading the `v3/visualize.html` HTML file.
(See `v3/pythontutor.py` for details.)

The benefit of running OPT locally is that you can test all changes without going online. So even
if you're eventually going to deploy NOT on Google App Engine, it makes good sense to install locally
for development and testing. The main caveat here is that Google App Engine currently runs Python 2.7,
so you won't be able to test Python 3 locally this way.


## Overall system architecture

OPT consists of a pure-Python backend and an HTML/CSS/JavaScript frontend.
Here is a typical user interaction sequence:

1. The user types in Python code in the web-based text editor (powered by [CodeMirror](http://www.codemirror.net/)).
2. The user hits the "Visualize execution" button.
3. The OPT frontend sends the user's Python code as a string to the backend by making an AJAX GET request.
4. The backend executes the Python code under the supervision of the Python [bdb](http://docs.python.org/library/bdb.html) debugger module, produces an execution trace, and send that trace back to the frontend in JSON format.
5. The frontend switches to a visualization pane, parses the execution trace, and renders the appropriate stack frames and heap objects.
6. When the user interacts with the frontend by stepping through execution points (forwards and backwards), the frontend renders the proper data structures WITHOUT making another call to the backend.

All relevant files are located in `OnlinePythonTutor/v3/`, since v3 is the currently-active version.

The frontend consists of:
        visualize.html
        css/opt-frontend.css
        js/opt-frontend.js
        css/pytutor.css
        js/pytutor.js
        <a bunch of auxiliary css and js files such as libraries>

`pytutor.[js|css]` contain the bulk of the OPT frontend code. In theory, if you set things up correctly,
you should be able to **embed** an OPT visualization into any webpage with one line of JavaScript that looks like:

        var v = new ExecutionVisualizer(domRoot, traceFromBackend, optionalParams);

Thus, the design of `pytutor.[js|css]` is meant to be as modular as possible, which means abstracting
everything in an `ExecutionVisualizer` object. This way, you can create multiple visualizer objects
to embed on the same webpage and not have them interfere with one another.

`opt-frontend.[js|css]` contain code that is specific to the `visualize.html` page and doesn't make sense for, say,
embedding OPT visualizations into other types of webpages.

The backend consists of:

        pg_logger.py  : the main entry point for the OPT backend
        pg_encoder.py : encodes the trace format into JSON to send to frontend
        generate_json_trace.py : script to test the backend independent of the frontend
        app.yaml and pythontutor.py : config files for Google App Engine
        web_exec.py : example CGI script for deploying backend on CGI-enabled webservers
        

## Hacking on the backend

To modify the backend, you will mainly need to understand `pg_logger.py` and `pg_encoder.py`.

### Two quick tips for starters

First, run `generate_json_trace.py` to see the trace that the backend generates for a given input Python program.
This is the main way to do an "end-to-end" test on your backend modifications. For example, if you wrote a Python
program stored in `example.py`, then running:

        python generate_json_trace.py example.py
        
will print a JSON-formatted execution trace to stdout. This is exactly what the backend sends to the frontend.
(Actually not quite: the sent trace is actually compressed to eliminate all extraneous spaces and newlines.
But for testing, I've made the trace more human-readable.)

Second, when you're "print debugging" in the backend, you can't simply print to stdout, since `pg_logger.py`
*redirects* stdout to a buffer. Instead, you need to write all of your print statements as:

        print >> sys.stderr, <debug message to print>
        
so that the output goes to stderr.

The easiest way to debug is to insert in print statements (to stderr) and then run `generate_json_trace.py` on
small code examples.

### 
# Developer's Guide Overview

This document is a starting point for anyone who wants to hack on
Online Python Tutor (thereafter abbreviated as OPT). View it online at:

https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/developer-overview.md

Look at the Git history to see when this document was last updated; the more time
elapsed since that date, the more likely things are out-of-date.

I'm assuming that you're competent in Python, JavaScript, command-line-fu, and Google-fu,
so I won't do much hand-holding in these directions.
But feel free to email philip@pgbovine.net if you have questions.

And please excuse the sloppy writing; I'm not trying to win any style awards here :)


## Getting Started: Running OPT locally on your machine

When you check out OPT from GitHub, it's configured by default to run on Google App Engine
(but it can also run fine on a CGI-enabled webserver such as Apache).

To run a local instance, download/install
the Google App Engine [Python SDK](https://developers.google.com/appengine/downloads)
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

```javascript
var v = new ExecutionVisualizer(domRoot, traceFromBackend, optionalParams);
```

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

```python
print >> sys.stderr, <debug message to print>
```
        
so that the output goes to stderr.

The easiest way to debug is to insert in print statements (to stderr) and then run `generate_json_trace.py` on
small code examples.


### Backend control flow

Let's trace through a typical backend run to get a sense of how it works:

The main entry point is this function in `pg_logger.py`:

```python
def exec_script_str(script_str, cumulative_mode, finalizer_func):
```

`script_str` is the entire string contents of the Python program for the backend to execute.
Ignore `cumulative_mode` for now (just set it to `False`). `finalizer_func` is the function to call
after the backend is done generating a trace.

Let's look at how `generate_json_trace.py` calls `exec_script_str` (using a simplified version of the code):

```python
import pg_logger, json

def json_finalizer(input_code, output_trace):
  ret = dict(code=input_code, trace=output_trace)
  json_output = json.dumps(ret, indent=2)
  print(json_output)

pg_logger.exec_script_str(open("example.py").read(), False, json_finalizer)
```

In this simplified example, the script opens `example.py`, reads its contents into a string, and passes it
into `exec_script_str`. The finalizer function is `json_finalizer`, which takes two parameters --
the original code from `example.py` (`input_code`) and the execution trace that it produced (`output_trace`) --
inserts both into a dict, encodes that dict as a JSON object, and then prints that JSON object to stdout.
That's why when you run `generate_json_trace.py`, its output is a JSON object printed to stdout.

Note that if you pass in another finalizer function, then you can do other actions like postprocessing
the output trace or saving it to a file rather than printing to stdout.

Now that you know what you pass into `exec_script_str` and what comes out of it, let's dive into its guts
to see how that execution trace (`output_trace`) is produced. Here is the code for `exec_script_str` in `pg_logger.py`:

```python
def exec_script_str(script_str, cumulative_mode, finalizer_func):
  logger = PGLogger(cumulative_mode, finalizer_func)

  try:
    logger._runscript(script_str)
  except bdb.BdbQuit:
    pass
  finally:
    logger.finalize()
```

This code creates a `PGLogger` object then calls its `_runscript` method to run the script passed in as `script_str`.
After execution finishes (possibly due to a bdb-related exception), the `finalize` method is run. This method
does some postprocessing of the trace (`self.trace`) and then calls the user-supplied `finalizer_func`.

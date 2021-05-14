# Overview for Developers

**NOTE THAT OnlinePythonTutor/v5-unity/ is the latest version, so update
these instructions to use that directory! e.g., see https://github.com/pgbovine/OnlinePythonTutor/blob/master/v5-unity/README.txt

This document may be obsolete by now. Use at your own risk.**

This document is a starting point for anyone who wants to hack on
Online Python Tutor (thereafter abbreviated as OPT). View it online at:

https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/developer-overview.md

Look at the Git history to see when this document was last updated; the more time
elapsed since that date, the more likely things are out-of-date.

I'm assuming that you're competent in Python, JavaScript, command-line-fu, and Google-fu,
and [command-line BS](http://www.pgbovine.net/command-line-bullshittery.htm).

This guide isn't meant to be comprehensive; rather, it's a starting point for learning about the code
and development workflow. You may still be confused about details after reading it, so
feel free to email philip@pgbovine.net if you have questions.


## Running Python Tutor locally on your machine using Bottle:

First install the [bottle](http://bottlepy.org/) micro web framework:

    easy_install pip
    pip install bottle

And then run:

    cd OnlinePythonTutor/v3/
    python bottle_server.py
    # python3 bottle_server.py # if you want to run for Python 3

Use `python3` if you want to test the Python 3 backend. Note that when you run with bottle, you will **always trigger the backend for the version of Python used to invoke it**, so the Python 2/3 language toggle selector on the frontend is meaningless. You will also not be able to test other language backends locally.


If all goes well, when you visit this URL, you should see the Python Tutor visualizer: http://localhost:8003/visualize.html

And the live programming mode is here: http://localhost:8003/live.html

However, **only** run this app locally for testing, not in production, since all security checks are disabled.


## Overall system architecture

OPT consists of a pure-Python backend and an HTML/CSS/JavaScript frontend.
Here is a typical user interaction sequence for Python (this will differ for other languages):

1. The user visits [visualize.html](http://pythontutor.com/visualize.html) and types in Python code in the web-based text editor.
2. The user hits the "Visualize Execution" button.
3. The OPT frontend sends the user's Python code as a string to the backend by making an Ajax GET request.
4. The backend executes the Python code under the supervision of the Python [bdb](http://docs.python.org/library/bdb.html) debugger, produces an execution trace, and sends that trace back to the frontend in JSON format.
5. The frontend switches to a visualization display, parses the execution trace, and renders the appropriate stack frames, heap objects, and pointers.
6. When the user interacts with the frontend by stepping through execution points, the frontend renders the proper data structures **without** making another subsequent call to the backend.

All relevant files are located in `OnlinePythonTutor/v3/`, since v3 is the currently-active version.

The frontend consists of:
```
visualize.html
css/opt-frontend.css
js/opt-frontend.js
js/opt-frontend-common.js
css/pytutor.css
js/pytutor.js
<a bunch of auxiliary css and js files such as libraries>
```

`pytutor.[js|css]` contain the bulk of the OPT frontend code. In theory, you should be able to **embed** an
OPT visualization into any webpage with one line of JavaScript that looks like:

```javascript
var v = new ExecutionVisualizer(domRoot, traceFromBackend, optionalParams);
```

Thus, the design of `pytutor.[js|css]` is meant to be as modular as possible, which means abstracting
everything in an `ExecutionVisualizer` class. This way, you can create multiple visualizer objects
to embed on the same webpage without them interfering with one another.

`opt-frontend.[js|css]` contain code that is specific to the `visualize.html` page and doesn't make sense for, say,
embedding OPT visualizations into other webpages.

The Python backend consists of:
```
pg_logger.py  - the main entry point to the OPT backend
pg_encoder.py - encodes the trace format into JSON to send to frontend
generate_json_trace.py - script to test the backend independent of the frontend
app.yaml, pythontutor.py - files for deploying on Google App Engine (obsolete)
web_exec.py - example CGI script for deploying backend on CGI-enabled webservers
```        

This backend works with both Python 2 and 3. (Other language backends are located in [v4-cokapi/](https://github.com/pgbovine/OnlinePythonTutor/tree/master/v4-cokapi), not in v3/)


## Hacking the Python backend

To modify the Python backend, you will mainly need to understand `pg_logger.py` and `pg_encoder.py`.


### Two quick tips for starters

Since the backend's details might change, rather than documenting every last detail, I'd rather equip you with
the knowledge needed to experiment with the code yourself, since that knowledge is less likely to get outdated.

First, run `generate_json_trace.py` to see the trace that the backend generates for a given input Python program.
This is the main way to do an "end-to-end" test on your backend modifications. For example, if you want the backend
to process a Python program stored in `example.py`, then run:

```
python generate_json_trace.py example.py
```

Doing so will print a JSON-formatted execution trace to stdout.
This data is exactly what the backend sends to the frontend.
(Actually not quite: The sent trace is actually compressed to eliminate all extraneous spaces and newlines.
But for testing purposes, I've made the trace more human-readable.)

Second, when you're "print debugging" in the backend, you can't simply print to stdout, since `pg_logger.py`
*redirects* stdout to a buffer. Instead, you need to write all of your print statements (in Python 2) as:

```python
print >> sys.stderr, <your debug message>
```
        
so that the output goes to stderr.

The easiest way to debug or investigate how some part of the code works is to **insert in print statements (to stderr)
and then run `generate_json_trace.py` on small code examples**. Trust me -- being able to do this well is way more
effective than memorizing detailed documentation (which could be outdated by the time you read it).


### Backend control flow

Let's now trace through a typical backend run to get a sense of how it works.

The main entry point is this function in `pg_logger.py`:

```python
def exec_script_str(script_str, cumulative_mode, finalizer_func):
```

`script_str` contains the entire string contents of the Python program for the backend to execute.
Ignore `cumulative_mode` for now (just set it to `False`). `finalizer_func` is the function to call
after the backend is done generating a trace.

Let's look at how `generate_json_trace.py` calls `exec_script_str` (using a simplified version of its code):

```python
# simplified version of generate_json_trace.py
import pg_logger, json

def json_finalizer(input_code, output_trace):
  ret = dict(code=input_code, trace=output_trace)
  json_output = json.dumps(ret, indent=2)
  print(json_output)

pg_logger.exec_script_str(open("example.py").read(), False, json_finalizer)
```

In this simplified example, the script opens `example.py`, reads its contents into a string, and passes that string
into `exec_script_str`. The finalizer function is `json_finalizer`, which takes two parameters --
the original code from `example.py` (`input_code`) and the execution trace that it produced (`output_trace`) --
inserts both into a dict, encodes that dict as a JSON object, and then prints that JSON object to stdout.
That's why when you run `generate_json_trace.py`, its output is a JSON object printed to stdout.

Note that if you pass in another finalizer function, then you can do other actions like postprocessing
the output trace or saving it to a file rather than printing to stdout.

Now that you know what's passed into `exec_script_str` and what comes out of it, let's dive into its guts
to see how that all-important execution trace (`output_trace`) is produced.
Here is the code for `exec_script_str` in `pg_logger.py`:

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

This code creates a `PGLogger` object then calls its `_runscript` method to run the user's program (from `example.py`),
which is passed in as `script_str`.
After execution finishes (possibly due to a bdb-related exception), the `finalize` method is run. This method
does some postprocessing of the trace (`self.trace`) and then finally calls the user-supplied `finalizer_func`.

`PGLogger` is a subclass of [bdb.Bdb](http://docs.python.org/library/bdb.html#bdb.Bdb),
which is the Python standard debugger module. It stores lots of fields to record what
is going on as it executes the program that the user passed in as `script_str`. Its `_runscript` method
is where the action starts. This method first sets up a sandboxed environment containing a restricted
set of builtins (`user_builtins`) and redirection for stdout (`user_stdout`), and then executes this code:

```python
try:
  self.run(script_str, user_globals, user_globals)
except SystemExit:
  raise bdb.BdbQuit
```

The `self.run` method is actually [inherited from bdb.Bdb](http://docs.python.org/library/bdb.html#bdb.Bdb.run).
It executes the contents of `script_str` in a modified global environment (`user_globals`).

Ok, the debugger has just started executing the program that the user passed in (from `example.py` in our example).
What happens now? Here's where the magic happens. Look at the methods called
`user_call`, `user_return`, `user_exception`, and `user_line`. Again, those are all
[inherited from bdb.Bdb](http://docs.python.org/library/bdb.html#bdb.Bdb);
take a minute to read up on what they're supposed to do.

As the user's program is running, bdb
will pause execution at every function call, return, exception, and single-line step (most common).
It then transfers control over to the respective handler method.
Since `PGLogger` overrides those handler methods, it can hijack control at
crucial points during program execution to do what it needs to do.

Since `PGLogger` does similar things regardless of why execution was paused (function call, return, exception, or single-line step),
all handlers dispatch to a giant method called `interaction`.

During a call to `interaction`, the backend collects the state of the stack and all run-time data and then creates a
trace entry (`trace_entry` dict). Then it appends `trace_entry` onto `self.trace`:

```python
self.trace.append(trace_entry)
```

Every time bdb pauses the user's program's execution and dispatches to `interaction` in `PGLogger`, one new trace
entry is created. At the end of execution, `self.trace` contains as many trace entries as there were "steps"
in the user's program execution. Each step more-or-less corresponds to one line being executed.
(To guard against infinite loops, `PGLogger` terminates execution when `MAX_EXECUTED_LINES` steps have been executed.)


### Execution Trace Format

A lot of complicated stuff happens within `interaction` to grab a snapshot of the execution state and encode
it into an execution trace entry. Insert a bunch of print statements (remember, to stderr) to get a sense of what's going on.

In addition, I've written up a separate document describing the exact format of an execution trace:

https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/opt-trace-format.md


### Backend regression tests

To run the Python backend tests, cd into `v3/tests/` and run `run-all-tests.sh` -- you will need the exact Python versions mentioned in the script itself. Run `python golden_test.py` to see individual test case options. Note that there might be minor diffs that show up on your machine, so the test suite isn't completely deterministic.


## Hacking the frontend

(TODO: write me sometime!)

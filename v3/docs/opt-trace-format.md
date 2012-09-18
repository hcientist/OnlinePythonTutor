# Execution Trace Format

This document describes the execution trace format that serves as the
interface between the frontend and backend of Online Python Tutor
(thereafter abbreviated as OPT).

It is a starting point for anyone who wants to create a different
backend (e.g., for another programming language) or a different frontend
(e.g., for visually-impaired students). View it online at:

https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/opt-trace-format.md

Look at the Git history to see when this document was last updated; the
more time elapsed since that date, the more likely things are
out-of-date.

I'm assuming that you're competent in Python, JSON, command-line-fu, and
Google-fu. Feel free to email philip@pgbovine.net if you have questions.

And please excuse the sloppy writing; I'm not trying to win any style awards here :)


## Trace Overview

Before you continue reading, I suggest for you to first skim the Overview for Developers doc:
https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/developer-overview.md

Pay particular attention to what `generate_json_trace.py` is and how to run it:
https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/developer-overview.md#two-quick-tips-for-starters

Let's start with a simple example. Create an `example.py` file with the following contents:
```python
x = 5
y = 10
z = x + y
```

Now run:
```
python generate_json_trace.py example.py
```

and you should see the following output:
```javascript
{
  "code": "x = 5\ny = 10\nz = x + y\n\n", 
  "trace": [
    {
      "ordered_globals": [], 
      "stdout": "", 
      "func_name": "<module>", 
      "stack_to_render": [], 
      "globals": {}, 
      "heap": {}, 
      "line": 1, 
      "event": "step_line"
    }, 
    {
      "ordered_globals": [
        "x"
      ], 
      "stdout": "", 
      "func_name": "<module>", 
      "stack_to_render": [], 
      "globals": {
        "x": 5
      }, 
      "heap": {}, 
      "line": 2, 
      "event": "step_line"
    }, 
    {
      "ordered_globals": [
        "x", 
        "y"
      ], 
      "stdout": "", 
      "func_name": "<module>", 
      "stack_to_render": [], 
      "globals": {
        "y": 10, 
        "x": 5
      }, 
      "heap": {}, 
      "line": 3, 
      "event": "step_line"
    }, 
    {
      "ordered_globals": [
        "x", 
        "y", 
        "z"
      ], 
      "stdout": "", 
      "func_name": "<module>", 
      "stack_to_render": [], 
      "globals": {
        "y": 10, 
        "x": 5, 
        "z": 15
      }, 
      "heap": {}, 
      "line": 3, 
      "event": "return"
    }
  ]
}
```

Recall that when OPT is deployed on a webserver, the backend generates this trace and sends it to the frontend,
where it will be turned into a visualization.

[Click here](http://pythontutor.com/visualize.html#code=x+%3D+5%0Ay+%3D+10%0Az+%3D+x+%2B+y&mode=display&cumulative=false&py=2&curInstr=0)
to see the visualization of this trace (open it in a new window if possible).
Note that the trace object contains *all* of the information required to create this visualization.

The trace is a JSON object with two fields: `code` is the string contents of the code
to be visualized, and `trace` is the actual execution trace, which consists of a list of execution points.

In the above example, `trace` is a list of four elements since there are four execution points.
If you step through the visualization, you'll notice that there are exactly four steps, one for each
element of the `trace` list.
(Sometimes the frontend will filter out some redundant entries in `trace`, but a simplifying assumption
is that `trace.length` is the number of execution steps that the frontend renders.)

Ok, still with me? Let's now dig into what an individual element in `trace` looks like.


## Execution Point Objects

The central type of object in a trace is an "execution point", which represents the state of the computer's (abstract)
memory at a certain point in execution. Recall that a trace is an ordered list of execution points.

The key concept to understand is that the frontend renders an execution point by simply looking at
the contents of the corresponding execution point object, **without consulting any of its neighbors**.

Ok, let's now look at the **four** execution points in our above example in order. The first point
is what the frontend visualizes when it says "Step 1 of 3":

```javascript
    {
      "ordered_globals": [], 
      "stdout": "", 
      "func_name": "<module>", 
      "stack_to_render": [], 
      "globals": {}, 
      "heap": {}, 
      "line": 1, 
      "event": "step_line"
    }
```

This is pretty much what an "empty" execution point object looks like. `line` shows the line number of the
line that is *about to execute*, which is line 1 in this case. And `event` is `step_line`, which indicates
that an ordinary single-line step event is about to occur. `func_name` is the function that's currently
executing: In this case, `<module>` is the faux name for top-level code that's not in any function.
All of the other fields are empty, and if you look at the visualization, nothing is rendered in the "Frames"
or "Objects" panes.

Ok now let's look at the second point, which corresponds to the frontend visualization when it says
"Step 2 of 3":

```javascript
    {
      "ordered_globals": [
        "x"
      ], 
      "stdout": "", 
      "func_name": "<module>", 
      "stack_to_render": [], 
      "globals": {
        "x": 5
      }, 
      "heap": {}, 
      "line": 2, 
      "event": "step_line"
    }
```

Ok note that `line` is now 2, which means that line 2 is *about* to execute (yes, this convention is a bit confusing,
but it's what the bdb debugger gives us). `globals` is now populated with one key-value pair: the global variable
`x` has a value of `5`. That makes sense since we just executed line 1 (from the previous execution point),
which was the code `x = 5`. If you look at the
[visualization at this step](http://pythontutor.com/visualize.html#code=x+%3D+5%0Ay+%3D+10%0Az+%3D+x+%2B+y&mode=display&cumulative=false&py=2&curInstr=1),
you'll see that `x` has been assigned to `5`.

Ok let's keep marching to the next execution point, which is the one that corresponds to "Step 3 of 3"
in the frontend:

```javascript
    {
      "ordered_globals": [
        "x", 
        "y"
      ], 
      "stdout": "", 
      "func_name": "<module>", 
      "stack_to_render": [], 
      "globals": {
        "y": 10, 
        "x": 5
      }, 
      "heap": {}, 
      "line": 3, 
      "event": "step_line"
    }
```

Now `line` is 3, because we're about to execute line 3 (we just executed lines 1 and 2). Notice that there is a
new key-value pair in`globals` showing that `y` has been assigned to `10`. No surprises here, since we just
executed the line `y = 10`.

Ok now this is where I want to talk about `ordered_globals`, which is a list of global variables (i.e.,
keys in `globals`) in the order that the frontend should visualize them. The backend appends variable
names in their order of appearance throughout execution. Why is this list necessary? Because `globals`
is an object whose keys are unsorted, so if you don't also keep an `ordered_globals` sorted list,
then the visualization might end up being jarring. For instance, at one execution point, it might
render `x` and then `y`, and at the next execution point, it might render `y` and then `x`, thereby
causing the visualization to "jitter" unnecessarily. And I've found that it looks aesthetically pleasing
when variables are sorted in their order of appearance as you step forwards through execution.

Still with me? Ok, let's get to the final execution point, which corresponds to the frontend displaying
"Program terminated" ([click here](http://pythontutor.com/visualize.html#code=x+%3D+5%0Ay+%3D+10%0Az+%3D+x+%2B+y&mode=display&cumulative=false&py=2&curInstr=3)
to jump directly there).

```javascript
    {
      "ordered_globals": [
        "x", 
        "y", 
        "z"
      ], 
      "stdout": "", 
      "func_name": "<module>", 
      "stack_to_render": [], 
      "globals": {
        "y": 10, 
        "x": 5, 
        "z": 15
      }, 
      "heap": {}, 
      "line": 3, 
      "event": "return"
    }
```

This time, the event is a `return`, which signifies "returning" from the top-level module code (meaning the program
has terminated). Note that now there is another new variable `z`, which is bound to `15` since `z = x + y` just executed.
Note that, again, `ordered_globals` shows all three variables in their order of appearance.

Ok, that's it for the basic tour!

## Heap Objects

## Function Stack Frames

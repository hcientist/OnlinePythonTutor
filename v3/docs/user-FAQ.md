# Frequently Asked Questions from users of Online Python Tutor

Email philip@pgbovine.net if you have a question that isn't addressed here.

#### I thought all objects in Python are (conceptually) on the heap; why does Online Python Tutor render primitive values (e.g., numbers, strings) inside of stack frames?

This was a design decision made to keep the display less cluttered;
if we were truly faithful to Python's semantics, that would result in far too many arrows (pointers) being drawn.
However, note that since primitives are **immutable** and thus behave identically regardless of aliasing,
it doesn't matter whether they're rendered in the stack or heap.

#### Whoa, I get an unknown error when I try to use the `re` module (or other modules)

Yep, Online Python Tutor currently has very limited support for external modules. The only module functions that work
are those involving native C function calls (e.g., "import math; x = math.sqrt(9)"). Making **pure-Python
function calls** in external modules will lead to an unknown error.


#### Visualizations of object-oriented programs are confusing; why are there grayed-out frames everywhere?

We haven't "cleaned-up" the visualizations to look better for OOP code examples;
they are simply displaying what Python is doing step-by-step as those programs execute.
Please email if you have suggestions for more aesthetically-pleasing yet accurate visualizations.


#### Did you know that stepping through code with generators looks weird when "display frames of exited functions" is selected?

Yes, this is a known bug, but sadly the fix isn't straightforward at the moment.

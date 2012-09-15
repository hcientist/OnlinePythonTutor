# Frequently Asked Questions from users of Online Python Tutor

Email philip@pgbovine.net if you have a question that isn't addressed here.

#### I thought all objects in Python are on the heap; why does Online Python Tutor render primitive values (e.g., numbers, strings) inside of stack frames?

This was a design decision made to keep the display less cluttered;
if we were truly faithful to Python's semantics, that would result in far too many arrows (pointers) being drawn.
However, note that since primitives are **immutable** and thus behave identically regardless of aliasing,
it doesn't matter whether they're rendered in the stack or heap.


#### Did you know that stepping through code with generators looks weird when "display frames of exited functions" is selected?

Yes, this is a known bug, but the fix isn't straightforward at the moment.

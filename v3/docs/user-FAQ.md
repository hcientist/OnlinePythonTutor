# Frequently Asked Questions from users of Online Python Tutor

Email philip@pgbovine.net if you have a question that isn't addressed here.


#### I thought all objects in Python are (conceptually) on the heap; why does Online Python Tutor render primitive values (e.g., numbers, strings) inside of stack frames?

This was a design decision made to keep the display less cluttered;
if we were truly faithful to Python's semantics, that would result in far too many arrows (pointers) being drawn.
However, note that since primitives are **immutable** and thus behave identically regardless of aliasing,
it doesn't matter whether they're rendered in the stack or heap.

Update on 2013-01-06: I've just added a drop-down menu option with two choices:
"inline primitives and nested objects" versus "render all objects on the heap".
If you want to render all objects on the heap, select the latter option.
To avoid too many arrows being drawn, also toggle the "draw references using arrows" option
to "use text labels for references".


#### I don't like your default toggle options. Can I set different defaults?

Of course! Toggle options are customizable via the query string. Here are the default settings:

http://pythontutor.com/visualize.html#cumulative=false&heapPrimitives=false&drawParentPointers=false&textReferences=false&showOnlyOutputs=false&py=2

For example, if you want to default to Python 3, visit:
http://pythontutor.com/visualize.html#&py=3

Or if you want to render all objects on the heap and use text label references, visit:
http://pythontutor.com/visualize.html#heapPrimitives=true&textReferences=true

The possibilities are endless! (or 2^6 or something.)


#### Did you know that stepping through code with generators looks weird when "display frames of exited functions" is selected?

Yep, this is a known bug, but sadly the fix isn't straightforward at the moment.

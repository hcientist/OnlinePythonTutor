# Frequently Asked Questions from users of Online Python Tutor

This document is **deprecated**; instead refer to the [**current list of unsupported features**](https://github.com/pgbovine/OnlinePythonTutor/blob/master/unsupported-features.md)


Email philip@pgbovine.net if you have a question that isn't addressed here.

#### I thought all objects in Python are (conceptually) on the heap; why does Python Tutor render primitive values (e.g., numbers, strings) inside of stack frames?

This was a design decision made to keep the display less cluttered;
if we were truly faithful to Python's semantics, that would result in far too many arrows (pointers) being drawn.
However, note that since primitives are **immutable** and thus behave identically regardless of aliasing,
it doesn't matter whether they're rendered in the stack or heap.

Update on 2013-01-06: I've added a drop-down menu option with two choices:
"inline primitives and nested objects" versus "render all objects on the heap".
If you want to render all objects on the heap, select the latter option.
To avoid too many arrows being drawn, also toggle the default "draw references using arrows" option
to "use text labels for references". Here is a direct link to activate those two settings:

http://pythontutor.com/visualize.html#heapPrimitives=true&textReferences=true


#### I don't like your default toggle options. Can I set different defaults?

Of course! Toggle options are customizable via the query string. Here are the default settings:

http://pythontutor.com/visualize.html#cumulative=false&heapPrimitives=false&drawParentPointers=false&textReferences=false&showOnlyOutputs=false&py=2

For example, if you want to default to Python 3, visit:
http://pythontutor.com/visualize.html#&py=3

Or Java:
http://pythontutor.com/visualize.html#&py=java

Or if you want to render all objects on the heap and use text label references, visit:
http://pythontutor.com/visualize.html#heapPrimitives=true&textReferences=true


#### Can I run my own version offline without Internet access?

Yes, if you care about only Python. See the directions in [Overview for Developers](developer-overview.md). Unfortunately, this is much harder to do for other languages, since they use backends that are in v4-cokapi/ that communicate with the visualizer in more complex ways.


#### Why am I getting a server error or unknown error?

Hard to say :/ But here are some possible reasons:

- Your script is too big, size-wise (bigger than ~4,000 bytes or so). Python Tutor isn't meant to debug giant pieces of code. Shorten your code to visualize only the snippet you really care about.
- Your code might have certain non-ASCII characters that trip up the server. Basic Unicode support works, but I am not an internationalization expert, so some weird things may happen when coding in non-English languages.
- Out of memory: if your code allocates a lot of memory very quickly (e.g., `x**x`)
- Infinite loops (although that should usually result in a better error message)
- Python input() and raw_input() support may not be the most robust
- Python bytearray support is also spotty


#### I think I found a bug! Where can I see and file bug reports?

The simplest way is to email them to me: philip@pgbovine.net 

You can also file bugs in the issue tracker:

- [Main Python Tutor issue tracker](https://github.com/pgbovine/OnlinePythonTutor/issues)
- [C/C++ backends issue tracker](https://github.com/pgbovine/opt-cpp-backend/issues)


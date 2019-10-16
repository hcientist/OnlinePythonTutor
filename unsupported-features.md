### *Python Tutor's server may go down at any time, so don't rely on it for anything time-critical.*

### *There is no technical support available. This service is provided as-is for free.*

This service is maintained by one volunteer in my spare time, so I'm unable to respond to most bug reports and feature requests. Your issue is likely listed on this page. If you're sure it's *not* listed here, [email me](http://pgbovine.net/email-policy.htm) and use the "Generate permanent link" button to include a URL of your code.

- **If you don't receive a reply from me, assume that your issue will NOT be addressed**. Please do not email me multiple times.
- I can't provide technical support for users who want to install Python Tutor locally on their own computers or host it on their own servers.
- I am not accepting any code contributions or GitHub pull requests at this time. Feel free to fork the code and do whatever you like with it, as long as you abide by its software licenses.
- I can't provide support for Python Tutor code that's embedded within other people's websites, such as class websites or online tutorials. Contact the people in charge of those websites for help.

---
## Unsupported features

[Python Tutor](http://pythontutor.com/) currently does *not* support the following features:


### Python

- for strings and numbers, you can't rely on the behaviors of `id()` or `is` matching CPython on your computer; when teaching beginners, you shouldn't rely on these behaviors since they are implementation-specific optimizations.
  - for details, see GitHub issues [here](https://github.com/pgbovine/OnlinePythonTutor/issues/275) and [here](https://github.com/pgbovine/OnlinePythonTutor/issues/273) and [here](https://github.com/pgbovine/OnlinePythonTutor/issues/255)
- some infinite loops: the server times out without showing partial results or good error messages
  - to cut down execution times, [set Python breakpoints](https://youtu.be/80ztTXP90Vs?t=42) using `#break` comments
- random number generators and user input (via input() or raw_input()) [sometimes don't work well together](https://github.com/pgbovine/OnlinePythonTutor/issues/110)
- no 3rd-party library/module support: use the experimental "Python 3.6 with <a href="https://docs.anaconda.com/anaconda/">Anaconda</a>" mode if you want to import many more modules from the Anaconda distribution
- raw_input/input might not work in iframe embeds

### C and C++

- unions
- some complex typedefs
- taking text input from the user using scanf(), cin >>, etc.
- code with memory-related errors: it will fail-fast using [Valgrind
  Memcheck](http://valgrind.org/docs/manual/mc-manual.html)
- C++ STL and string objects aren't visualized nicely (see [GitHub issue](https://github.com/pgbovine/OnlinePythonTutor/issues/256))
- [doesn't show when function parameters get mutated](https://github.com/pgbovine/opt-cpp-backend/issues/57)
- [function return values are not visualized](https://github.com/pgbovine/opt-cpp-backend/issues/4)
- [stack arrays without compile-time sizes](https://github.com/pgbovine/opt-cpp-backend/issues/44)
- [read-only memory isn't visualized separately from the heap](https://github.com/pgbovine/opt-cpp-backend/issues/70)


### JavaScript

- asynchronous and event-driven code
  - including setTimeout, setInterval, etc.
  - promises, async/await
- anything that operates on webpages, such as DOM manipulation, alert(), prompt(), confirm(), etc.
  - this includes trying to import frontend libraries or frameworks (e.g., jQuery, React)
- Date() object


### Java

- some data structures like ArrayList aren't visualized properly (see [GitHub issue](https://github.com/pgbovine/OnlinePythonTutor/issues/236))


### Other unsupported features (language-independent)

- Stepping *within* a line of code to show how subexpressions get evaluated within that line; the best workaround is to split complex expressions into multiple lines and assign temporary variables on each line ([example](http://pythontutor.com/visualize.html#code=w%20%3D%205%0Ax%20%3D%2010%0Ay%20%3D%2020%0Az%20%3D%2030%0A%0A%23%20bad%3A%20executes%20all%20at%20once%0Aresult%20%3D%20w%20-%20x%20*%20%28y%20%2B%20z%29%0A%0A%23%20good%3A%20shows%20individual%20steps%0At1%20%3D%20y%20%2B%20z%0At2%20%3D%20x%20*%20t1%0Aresult2%20%3D%20w%20-%20t2&cumulative=false&heapPrimitives=nevernest&mode=edit&origin=opt-frontend.js&py=2&rawInputLstJSON=%5B%5D&textReferences=false)).
- Highlighting of what variables or data structure components changed in between steps (although that would be cool!)
- Unicode doesn't well, especially for Ruby: [#134](https://github.com/pgbovine/OnlinePythonTutor/issues/134), and Python 2: [#77](https://github.com/pgbovine/OnlinePythonTutor/issues/77), [#124](https://github.com/pgbovine/OnlinePythonTutor/issues/124), [#194](https://github.com/pgbovine/OnlinePythonTutor/issues/194); use ASCII characters when possible
- Passing in command-line arguments via argv[] array
- Multi-threaded, concurrent, or asynchronous code
  - Python Tutor is only for regular single-threaded execution
- Anything involving GUI programming or GUI/webpage components
- Reading data from external files (put all your data in strings when possible)
- Interfacing with databases, network, filesystem, or other external resources
- Importing external 3rd-party libraries (try "Python 3.6 with Anaconda (experimental)" if you want to use more libraries)
- Code that is too large in size. Python Tutor isn't meant for running large amounts of code, so shorten your code!
- Code that runs for too many steps (e.g., > 1,000 steps) or for a long time
  - shorten your code to isolate where you want to visualize and debug
  - or [set Python breakpoints](https://youtu.be/80ztTXP90Vs?t=42) using `#break` comments
- If you're behind some kinds of firewalls or proxy servers, the visualizer or live chat may not work
- User accounts, login, authentication, or integration with other third-party sites
- URL shortening (you should use your own third-party URL shortener service)
- https iframe embedding with non-Python languages (iframe embed should work for Python if you use `https://` for URL)
- Other languages are not likely to get supported at this point due to lack of time
- Standalone application or offline mode (you can download the code and install it yourself but I don't have time to provide tech support for local installations)
- Editing multiple source code files (Python Tutor is *not* a replacement for an IDE)
- Integration with other programming environments like Jupyter Notebooks, IDEs, text editors, etc.

Look through these issue trackers for more known bugs and unsupported features:
- https://github.com/pgbovine/OnlinePythonTutor/issues
- https://github.com/pgbovine/opt-cpp-backend/issues

---

### Misc. FAQ

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

http://pythontutor.com/visualize.html#cumulative=false&heapPrimitives=false&drawParentPointers=false&textReferences=false&showOnlyOutputs=false&py=3

For example, if you want to default to C, visit:
http://pythontutor.com/visualize.html#&py=c

Or Java:
http://pythontutor.com/visualize.html#&py=java

Or if you want to render all objects on the heap and use text label references, visit:
http://pythontutor.com/visualize.html#heapPrimitives=true&textReferences=true


#### Can I iframe-embed using https?

Yes, only for Python, though. Change the embed URL from http:// to https:// and it should hopefully work.

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

<!--
Some of these features will eventually be supported, but others probably won't, due to implementation challenges and other priorities.

For more details on project status and issue prioritization, check out these videos from March 2018:
- [Python Tutor project status - 1 of 2 - common feature requests & feasible fixes](https://www.youtube.com/watch?v=oKIqejkxqP0)
- [Python Tutor project status - 2 of 2 - bigger feature requests & unlikely fixes](https://www.youtube.com/watch?v=8o-XeFTgD40)

... and this earlier video from Oct 2017: [Python Tutor Software Development Philosophy](https://www.youtube.com/watch?v=sVtXLdBRfyE)
-->

### C and C++

- unions
- some complex typedefs
- taking text input from the user using scanf(), cin >>, etc.
- code with memory-related errors: it will fail-fast using [Valgrind
  Memcheck](http://valgrind.org/docs/manual/mc-manual.html)
- [doesn't show when function parameters get mutated](https://github.com/pgbovine/opt-cpp-backend/issues/57)
- [function return values are not visualized](https://github.com/pgbovine/opt-cpp-backend/issues/4)
- [stack arrays without compile-time sizes](https://github.com/pgbovine/opt-cpp-backend/issues/44)
- [read-only memory isn't visualized separately from the heap](https://github.com/pgbovine/opt-cpp-backend/issues/70)

### JavaScript

- asynchronous event-driven code
  - including setTimeout, setInterval, etc.
  - promises, async/await
- anything that operates on webpages, such as DOM manipulation, alert(), prompt(), confirm(), etc.
- Date() object


### Python

- some infinite loops: the server times out without showing partial results or good error messages
  - to cut down execution times, [set Python breakpoints](https://youtu.be/80ztTXP90Vs?t=42) using `#break` comments
- asynchronous code
- random number generators and user input (via input() or raw_input()) [sometimes don't work well together](https://github.com/pgbovine/OnlinePythonTutor/issues/110)
- you can't rely on the behavior of id() matching CPython; note that when teaching beginners, you shouldn't rely on id() since oftentimes these behaviors aren't part of the Python language spec (they're due to implementation-specific optimizations).
- no 3rd-party library/module support: use the experimental "Python 3.6 with <a href="https://docs.anaconda.com/anaconda/">Anaconda</a>" mode if you want to import many more modules from the Anaconda distribution
- (note: remember that Python 2 and 3 support slightly different kinds of language constructs)


### Other unsupported features (language-agnostic)

- Stepping *within* a line of code to show how subexpressions get evaluated within that line
- Unicode doesn't work well in general (especially for Ruby and Python 2); use ASCII characters when possible
- Passing in command-line arguments via argv[] array
- Multi-threaded, concurrent, or asynchronous code
- Anything involving GUI programming or GUI/webpage components
- Reading data from external files; put all your data in strings when possible
- Interfacing with databases, network, filesystem, or other external resources
- Importing external 3rd-party libraries (try "Python 3.6 with Anaconda (experimental)" if you want to use more libraries)
- Code that is too large in size; shorten your code!
- Code that runs for too many steps (e.g., > 1,000 steps) or for a long time
  - shorten your code to isolate where you want to visualize and debug
  - or [set Python breakpoints](https://youtu.be/80ztTXP90Vs?t=42) using `#break` comments
- If you're behind some kinds of firewalls or proxy servers, the visualizer may not work
- User accounts, login, authentication, or integration with other third-party sites
- URL shortening (use a third-party URL shortener service)

Look through these issue trackers for more known bugs and unsupported features:
- https://github.com/pgbovine/OnlinePythonTutor/issues
- https://github.com/pgbovine/opt-cpp-backend/issues

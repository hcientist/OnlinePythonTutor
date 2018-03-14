# Unsupported features in Python Tutor

This tool currently does NOT support these language features.

Some of these will eventually be supported, but others probably won't, due to implementation challenges and other priorities.

Email philip@pgbovine.net with more bug reports and use the "Generate shortened link" button to include a URL so that I can reproduce it.

### C and C++

- unions
- some complex typedefs
- taking text input from the user using scanf(), cin >>, etc.
- code with memory-related errors: it will fail-fast using [Valgrind
  Memcheck](http://valgrind.org/docs/manual/mc-manual.html)
- [doesn't show when function parameters get mutated](https://github.com/pgbovine/opt-cpp-backend/issues/57)
- [function return values are not visualized](https://github.com/pgbovine/opt-cpp-backend/issues/4)
- [stack arrays without compile-time sizes](https://github.com/pgbovine/opt-cpp-backend/issues/44)


### JavaScript

- promises
- asynchronous event-driven code
- variable names that contain special characters like '$'
- Date() object


### Python

- some infinite loops: the server times out without showing partial results or good error messages
- to cut down execution times, [set breakpoints](https://www.youtube.com/watch?v=80ztTXP90Vs) in Python using `#break` comments
- asynchronous code


### Other (language-agnostic)

- Unicode doesn't work well in general (especially for Ruby and Python 2); use ASCII characters when possible
- Passing in command-line arguments via argv[] array
- If you're behind some kinds of firewalls or proxy servers, sometimes
  the visualizer doesn't work
- Reading data from external files; put data inline in strings when possible
- Importing external 3rd-party libraries
- Code that is too large in size; shorten your code!
- Code that runs for too many steps (e.g., > 1,000 steps) or for a long time
  - shorten your code to isolate where you want to visualize and debug
  - or [set breakpoints](https://www.youtube.com/watch?v=80ztTXP90Vs) in Python using `#break` comments

Look through these issue trackers for additional bugs and unsupported features:
- https://github.com/pgbovine/OnlinePythonTutor/issues
- https://github.com/pgbovine/opt-cpp-backend/issues

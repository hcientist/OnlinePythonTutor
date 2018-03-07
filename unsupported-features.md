# Unsupported features in Python Tutor

This tool currently does NOT support these language features.

Some of these will eventually be supported, but others probably won't,
since they're too hard to implement.

### C and C++

- unions
- some complex typedefs
- taking text input from user using scanf(), cin >>, etc.
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

- asynchronous code
- some infinite loops: the server times out without showing partial results or a good error messages
- some Unicode, especially in Python 2


### Ruby

- Unicode


### Other (language-agnostic)

- Unicode doesn't work too well in general, so use ASCII characters when possible
- Passing in command-line arguments via argv[] array
- If you're behind some kinds of firewalls or proxy servers, sometimes
  the visualizer doesn't work
- Reading from external files
- Importing external 3rd-party libraries
- Code that is too large in size (shorten your code to smaller examples!)
- Code that runs for a long time

Look through these issue trackers for additional bugs and unsupported
features:
- https://github.com/pgbovine/OnlinePythonTutor/issues
- https://github.com/pgbovine/opt-cpp-backend/issues

Email philip@pgbovine.net with more bug reports and use the "Generate
shortened link" button to include a URL so that I can reproduce it.

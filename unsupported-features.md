# Unsupported features in Python Tutor

This tool currently does NOT support these language features.

Some of these will eventually be supported, but others probably won't,
since they're too hard to implement.

### C/C++:

- unions
- some complex typedefs
- taking text input from user using scanf(), cin >>, etc.
- [doesn't show when function parameters are mutated](https://github.com/pgbovine/opt-cpp-backend/issues/57)
- [function return values are not visualized](https://github.com/pgbovine/opt-cpp-backend/issues/4)
- [stack arrays without compile-time sizes](https://github.com/pgbovine/opt-cpp-backend/issues/44)


### JavaScript

- promises
- asynchronous event-driven code
- variable names that contain special characters like '$'
- Date() object


### Python

- asynchronous code
- 3rd-party libraries
- infinite loops - server simply times out without a good error message
- Unicode especially in Python 2, and raw_input()


### Ruby

- Unicode


### Other (language-agnostic)

- Unicode doesn't work too well in general, so use ASCII characters when possible
- Passing in command-line arguments via argc/argv

Look through these issue trackers for additional bugs and unsupported
features:
- https://github.com/pgbovine/OnlinePythonTutor/issues
- https://github.com/pgbovine/opt-cpp-backend/issues

Email philip@pgbovine.net with more bug reports and use "Generate
shortened link" to include a URL so that I can reproduce it.

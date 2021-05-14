# C/C++ Visualizer Backend

2018-03-04: The C/C++ visualizer backend lives here now!

It used to be in its own separate repo located at:
https://github.com/pgbovine/opt-cpp-backend

However, I still use this for tracking old legacy C/C++ issues before
finishing my migration: https://github.com/pgbovine/opt-cpp-backend/issues


Former README.md file from that repo:
---
This is the repo for the C/C++ backend for Online Python Tutor (http://pythontutor.com/)

Deployed online at:

- http://pythontutor.com/visualize.html#py=c (for C)
- http://pythontutor.com/visualize.html#py=cpp (for C++)

This code is based on a hacked version of Valgrind 3.11.0, downloaded from:
http://www.valgrind.org/downloads/valgrind-3.11.0.tar.bz2

Build dependencies:
- (basic Linux C compiler toolchain)
- binutils-dev

---
To install:

First grab the basic build dependencies:

sudo apt-get install \
build-essential git git-core libssl-dev \
autotools-dev \
automake \
libc6-dbg

then run:

./auto-everything.sh

now to make a docker container, run

'make docker'

Python Tutor -- http://pythontutor.com/ -- helps people overcome a fundamental barrier to learning programming: understanding what happens as the computer executes each line of a program's source code. Using this tool, you can write Python, Java, JavaScript, TypeScript, Ruby, C, and C++ programs in your Web browser and visualize what the computer is doing step-by-step as it executes those programs.

This tool was created by [Philip Guo](http://pgbovine.net/) in January 2010. [See project history](history.txt).

The latest development version of the code is in [v5-unity](v5-unity/),
although lots of legacy documentation still resides in [v3](v3/).

- [Unsupported features and known bugs](https://github.com/pgbovine/OnlinePythonTutor/blob/master/unsupported-features.md)
- [Frequently Asked Questions](v3/docs/user-FAQ.md)
- [Overview for Developers](v3/docs/developer-overview.md)

All documentation is viewable online at: https://github.com/pgbovine/OnlinePythonTutor/tree/master/v3/docs


### Quick Start

BY FAR the most preferred way to use Python Tutor is via the official website, since it contains the latest updates: http://pythontutor.com/

You can use [iframe embedding](v3/docs/embedding-HOWTO.md) to easily embed visualizations on your webpage.

If you want to run locally on your own computer, to run Python visualizations try:

```
pip install bottle # make sure the bottle webserver (http://bottlepy.org/) is installed
cd OnlinePythonTutor/v5-unity/
python bottle_server.py
```

You should see the visualizer at: http://localhost:8003/visualize.html

... and the live programming environment at: http://localhost:8003/live.html 

However, it can be hard to run your own visualizer locally for
non-Python languages, since there are complex dependencies in v4-cokapi/ that
I haven't yet cleanly packaged up. By default, the local version you run will
*call my own server to run the non-Python backends*, so please be mindful of
your bandwidth usage.

For further directions, see [Overview for Developers](v3/docs/developer-overview.md) or explore the [rest of the docs](v3/docs/).


### Acknowledgments

For code or security contributions:
- Irene Chen - experimental holistic visualization mode - v3/js/holistic.js
- John DeNero - helping with the official Python 3 port, bug fixes galore
- Mark Liffiton - localStorage bug fix
- Chris Meyers - custom visualizations such as v3/matrix.py and v3/htmlFrame.py
- Brad Miller - adding pop-up question dialogs to visualizations, other bug fixes
- David Pritchard and Will Gwozdz - Java visualizer and other frontend enhancements
- Peter Robinson - v3/make_visualizations.py
- Peter Wentworth and his students - working on the original Python 3 fork circa 2010-2011
- Security tips and vulnerability reports: Aaron E. (https://arinerron.com), Chris Horne (https://github.com/lahwran), Joshua Landau (joshua@landau.ws), David Wyde (https://davidwyde.com/)

For user testing and feedback from instructors' perspectives:
- Ned Batchelder
- Jennifer Campbell
- John Dalbey
- John DeNero
- Fredo Durand
- Michael Ernst
- David Evans
- Paul Gries
- Mark Guzdial
- Adam Hartz
- Sean Lip
- Fernando Perez
- Tomas Lozano-Perez
- Bertram Ludaescher
- Brad Miller
- Rob Miller
- Peter Norvig
- Andrew Petersen
- David Pritchard
- Suzanne Rivoire
- Guido van Rossum
- Peter Wentworth
- David Wilkins

... and many, many more!

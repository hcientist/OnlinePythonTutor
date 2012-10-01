# Embedding Online Python Tutor visualizations

This document is a starting point for anyone who wants to embed
Online Python Tutor (OPT) visualizations in their webpage. View it online at:

https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/embedding-HOWTO.md

Look at the Git history to see when this document was last updated; the more time
elapsed since that date, the more likely things are out-of-date.

I'm assuming that you're competent in Python, JavaScript, command-line-fu, and Google-fu,
so I won't do much hand-holding in these directions.

This guide isn't meant to be comprehensive; you will undoubtedly still
be confused about details after reading it, so feel free to email
philip@pgbovine.net if you have questions.

And please excuse the sloppy writing; I'm not trying to win any style awards here :)


## High-Level Overview

To embed a visualization, you:

1. Run the target Python program offline to generate an execution trace, which is one (really, really long)
string representing a JavaScript (JSON) object.
2. Copy that long string into a JavaScript .js file.
3. Include some other stuff in your .js file and then embed it within your HTML webpage.

Note that the embedded visualization is **read-only** -- that is, the user can interact with the visualization
by stepping forward and backward, but they cannot edit the code.
If the user wants to click the 'Edit code' button to edit the code, then they are
brought to the [code editor page](http://pythontutor.com/visualize.html).


## The Nitty-Gritty

Let's attempt to go [literate programming](http://en.wikipedia.org/wiki/Literate_programming) style now ... load up
[embedding-demo.html](http://pythontutor.com/embedding-demo.html) in
your browser to see a demo. And then view its [source code](https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/embedding-demo.html) and follow the instructions there,
which should then lead you to `v3/embedding-demo.js`.

Everything you need to know should be in the demo code!

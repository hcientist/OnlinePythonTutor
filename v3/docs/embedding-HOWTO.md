# Embedding Online Python Tutor visualizations

This document is a starting point for anyone who wants to embed
Online Python Tutor (OPT) visualizations in their webpage. View it online at:

https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/embedding-HOWTO.md

Look at the Git history to see when this document was last updated; the more time
elapsed since that date, the more likely things are out-of-date.

I'm assuming that you're competent in Python, JavaScript, command-line-fu, and Google-fu,
and [command-line BS](http://www.pgbovine.net/command-line-bullshittery.htm). This guide isn't meant to be comprehensive; you may still
be confused about details after reading it, so feel free to email
philip@pgbovine.net if you have questions.


## iframe embedding

An easy way to embed an OPT visualization on your website is to enclose it within an [iframe](http://www.w3schools.com/tags/tag_iframe.asp).

If you generate a visualization (e.g., <a href="http://pythontutor.com/visualize.html#code=x+%3D+5%0Ay+%3D+10%0Az+%3D+x+%2B+y&mode=display&cumulative=false&py=2&curInstr=3">click here</a>)
and then click the "Generate embed code" button at the bottom of the page, the following code will be generated:

```html
<iframe width="800" height="500" frameborder="0"
        src="http://pythontutor.com/iframe-embed.html#code=x+%3D+5%0Ay+%3D+10%0Az+%3D+x+%2B+y&cumulative=false&py=2&curInstr=3">
</iframe>
```

If you copy-and-paste the above code into your HTML webpage, then it will embed the given visualization as an iframe.

Change `http://` to `https://` in the `src` attribute if you want to embed it in a webpage served over https.

See [v5-unity/iframe-embed-demo.html](../../v5-unity/iframe-embed-demo.html) for a working demo showing several embedded iframes ([online here](http://pythontutor.com/iframe-embed-demo.html)).


### iframe embedding parameters

You can customize the iframe's size by adjusting the `width` and `height` parameters. All other parameters are passed
after the hash mark (`#` character) in the `src=` URL string. Note that OPT uses the hash mark rather than the usual
question mark `?` query string. Here are the currently-supported parameters:

- `code` - The Python code to visualize (mandatory: URL-encoded string)
- `py` - Language version (mandatory: `2` for Python 2.7 or `3` for Python 3.3, other languages: js, ts, ruby, java, c, cpp)
- `verticalStack` - Set to `true` if you want the code and visualization to stack atop one another (optional)
- `curInstr` - A (zero-indexed) integer of the execution point to directly jump to in the visualization (optional)
- `cumulative` - Set to `true` if you want exited functions to be displayed (optional)


## Direct embedding

The iframe-based approach has some limitations (e.g., hard to dynamically resize the enclosing iframe,
cannot run while offline, limited parameter choices).
Here are instructions for a more powerful but harder-to-use alternative -- directly embedding visualizations.


### High-Level Overview

To directly embed a visualization, you:

1. Run the target program offline to generate an execution trace, which is one (really, really long) string representing a JSON object. Each backend provides its own scripts for generating execution traces.
2. Save that string into a text file on your server, which will be loaded via AJAX by your JavaScript code.
3. Include some JavaScript code and then embed it within your HTML webpage.

Note that the embedded visualization is **read-only** -- that is, the user can interact with the visualization
by stepping forward and backward, but they cannot edit the code.
If the user wants to click the 'Edit code' button to edit the code, then they are
brought to the [code editor page](http://pythontutor.com/visualize.html).

Also, note that the visualization is run client-side; thus, after the user loads the webpage (from the Internet
or, say, a USB drive), they can play with the visualization without an Internet connection.

Finally, multiple visualizations can be embedded in a single HTML webpage.


### The Nitty-Gritty

Let's attempt to go [literate programming](http://en.wikipedia.org/wiki/Literate_programming) style now ... load up
[http://pythontutor.com/pytutor-embed-demo.html](http://pythontutor.com/pytutor-embed-demo.html) in
your browser to see a demo. Then view its [source code](https://github.com/pgbovine/OnlinePythonTutor/blob/master/v5-unity/pytutor-embed-demo.html) and follow the instructions within that file. Everything you need to know should be in the demo code!

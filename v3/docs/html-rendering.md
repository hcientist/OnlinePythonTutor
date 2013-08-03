# HTML rendering in Online Python Tutor

As of May 2013, Online Python Tutor contains an experimental magic
`setHTML` function that lets your scripts render HTML to the canvas (and
accompanying `setJS` and `setCSS` functions for JavaScript and CSS,
respectively).

Here is a
<a href="http://pythontutor.com/visualize.html#code=%23+display+a+bunch+of+big+red+numbers%0AsetCSS('.bigText+%7Bfont-size%3A+80pt%3B+color%3A+red%3B%7D')%0A%0Afor+i+in+range(5)%3A%0A++++setHTML('%3Cdiv+class%3D%22bigText%22%3E%25d%3C/div%3E'+%25+i)%0A%0A%23+now+display+an+image+from+my+website%0AsetHTML('%3Cimg+src%3D%22http%3A//pgbovine.net/hacking-on-box.jpg%22/%3E')%0A&mode=display&cumulative=false&heapPrimitives=false&drawParentPointers=false&textReferences=false&showOnlyOutputs=false&py=2&curInstr=0">simple example</a>
of `setHTML` at work.

Let's step through the code:


    # display a bunch of big red numbers
    setCSS('.bigText {font-size: 80pt; color: red;}')

    for i in range(5):
        setHTML('<div class="bigText">%d</div>' % i)

    # now display an image from my website
    setHTML('<img src="http://pgbovine.net/hacking-on-box.jpg"/>')


The first call to `setCSS` defines a `bigText` CSS class with a giant font and red color.
Then the code iterates through a loop five times and calls `setHTML` to set the HTML canvas
to contain a single `div` of class `bigText` with the loop index as its contents. Finally,
the code makes one final `setHTML` call to set the canvas to an image from my personal website.


## Creating external modules

It's really tedious to write out all of the HTML rendering code in the OPT input text box.
Thus, the best way to take advantage of HTML rendering is to define a custom
module to encapsulate all of the rendering code. Here is an example module:

https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/htmlexample_module.py

This example module defines a `ColorTable` class that represents a table whose cells
can be filled in with colors. Each time the `render_HTML` method is called, OPT
renders the contents of the table as an HTML table whose cells are filled in with
the respective colors.

Here is
<a href="http://pythontutor.com/visualize.html#code=from+htmlexample_module+import+ColorTable%0A%0At+%3D+ColorTable(3,+4)%0A%0At.set_color(0,+0,+'red')%0At.render_HTML()%0A%0At.set_color(1,+1,+'green')%0At.render_HTML()%0A%0At.set_color(2,+2,+'blue')%0At.render_HTML()%0A%0Afor+i+in+range(3)%3A%0A++++for+j+in+range(4)%3A%0A++++++++t.set_color(i,+j,+'gray')%0A++++++++t.render_HTML()&mode=display&cumulative=false&heapPrimitives=false&drawParentPointers=false&textReferences=false&showOnlyOutputs=false&py=2&curInstr=0">an example</a>
of this module in action:

    from htmlexample_module import ColorTable

    t = ColorTable(3, 4)

    t.set_color(0, 0, 'red')
    t.render_HTML()

    t.set_color(1, 1, 'green')
    t.render_HTML()

    t.set_color(2, 2, 'blue')
    t.render_HTML()

    for i in range(3):
        for j in range(4):
            t.set_color(i, j, 'gray')
            t.render_HTML()

If you step through the code in OPT, you'll see an HTML table appearing below the code
and getting gradually filled in with colors.

To get this module working with OPT, you need to first add its filename
(e.g., 'htmlexample_module') to the CUSTOM_MODULE_IMPORTS variable in pg_logger.py, approximately here:

https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/pg_logger.py#L119

To create your own custom modules, simply follow the conventions I've laid out with `htmlexample_module.py`!

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




The best way to take advantage of HTML rendering is to define a custom
module to encapsulate the rendering code:

https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/htmlexample_module.py

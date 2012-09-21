# Project Ideas

This document provides an overview of some project ideas for extending
Online Python Tutor (thereafter abbreviated as OPT). View it online at:

https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/project-ideas.md

These projects are listed roughly in order of difficulty.

Email philip@pgbovine.net if you're interested in working on anything here, or if you have other
project ideas.


## Enable beautiful print-outs of OPT visualizations (easy)

A lot of instructors want to print out their OPT visualizations to make handouts or lecture notes
for students.
However, the default CSS stylesheet is optimized for on-screen viewing and not for printing,
so when you try to print the diagrams, they look ugly and unreadable.

The project involves creating a custom CSS optimized for printing, especially on black-and-white printers.
Here is an example how-to guide to get started creating a CSS print style sheet ...
http://coding.smashingmagazine.com/2011/11/24/how-to-set-up-a-print-style-sheet/


## Add better Unicode support (medium)

This project is a great fit for someone familiar with coding in non-English languages.

Right now, OPT has poor-to-nonexistent Unicode support, so adding it is important for making it friendlier to
non-English audiences.

Here is one bug report that inspired this project idea:

"""
I’m having some fun with your nifty Python visualiser.
While trying too see what happens in Unicode strings are processed,
I encountered some odd little quirks such as a unicode character
being replace with a string representation of a Unicode code point
number in denary.


<a href="http://www.pythontutor.com/visualize.html#code=s+%3D+unicode(0x2015)%0Aa+%3D+'Myer'+%2B+s+%2B+'Briggs'%0Ax+%3D+a.index(s)%0Al+%3D+a%5B%3Ax%5D%0Ar+%3D+a%5Bx+%2B+len(s)%3A%5D%0Aprint+l%0Aprint+r%0Aprint+'%22'+%2B+a+%2B+'%22+is+'+%2B+str(len(a))+%2B+'+characters+long.'%0Afor+i,+z+in+unumerate(a)%3A%0A++print+'a%5B'+%2B+str(i)+%2B+'%5D+%3D+'+%2B+str(z)&mode=display&cumulative=false&py=2&curInstr=8">click to visualize code snippet</a>

Changing the first line to

```python
s = u'\u2015'
```

Causes an “unknown error” to be reported, as does the insertion of unicode characters like “—” (em dash) in string literals.

The following code causes the interpreter to hang.
```python
# -*- coding: utf-8 -*-
s = u'—'
```
"""

(Note that Unicode support in Python 2 and 3 involve different subtleties.)


## Migrate OPT backend to Skulpt (very hard)

# Project Ideas

This document provides an overview of some project ideas for extending
Online Python Tutor (thereafter abbreviated as OPT). View it online at:

https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/project-ideas.md

These projects are listed roughly in order of difficulty.

Email philip@pgbovine.net if you're interested in working on anything here, or if you have other
project ideas.


## Enable beautiful printouts of OPT visualizations (easy)

A lot of instructors want to print out their OPT visualizations to make handouts or lecture notes
for students.
However, the default CSS is optimized for on-screen viewing and not for printing,
so when you try to print the diagrams, they look ugly and unreadable.

The project involves creating a custom CSS optimized for printing, especially on black-and-white printers.
Here is an example how-to guide to get started creating a CSS print style sheet ...
http://coding.smashingmagazine.com/2011/11/24/how-to-set-up-a-print-style-sheet/


## Implement responsive web UI design for OPT frontend (easy/medium)

This is a good project for someone interested in visual and web design.

Implement the principles of [responsive web design](http://en.wikipedia.org/wiki/Responsive_Web_Design)
so that OPT visualizations (and the surrounding user interface) look good on displays of many different sizes
ranging from smartphones to tablets to laptops to giant desktop monitors.


## Offline mode for use as a production debugger (medium)

From a reader comment: "As a teaching tool it is invaluable, not only for teaching python, but for programming in general (what is going on in memory...).
I've actively used it to debug / trace short pieces of code. Any chance of having it offline (and without the limitations of an online tool like the inability to load all modules)? That would make a perfect pdb visualization tool."

You could imagine running a webserver on localhost and using OPT as a graphical frontend for pdb; interesting idea!

Notes from an email I sent on 2012-10-24: {

One possible offline application is to use OPT as a visual debugger for pdb (http://docs.python.org/library/pdb.html). The use case here would be:

1.) The user launches a special version of pdb augmented with OPT.
2.) The user types in some Python command to visualize.
3.) pdb starts a local webserver and pops up a web browser window.
4.) The visualization appears in the web browser window, and the user can interact with it.

Actually, now that I think about it, you can start even simpler without pdb. Here is an even simpler starting point:

1.) The user writes some code to visualize in a file on his/her computer.
2.) The user runs a special Python script that runs OPT on that file, launches a local webserver, and pops open a web browser window.
3.) The visualization appears in the web browser window.

Ok, that seems simpler as a starting point, and it will still teach you about local webservers and interfacing between the OPT backend and frontend.

Then comes the question of why this offline mode might be useful (beyond being a good learning exercise). After all, just by following the directions in the developer overview docs, you've essentially set up OPT to run offline without an Internet connection. So my plan above doesn't give you any extra functionality. However, I think the potential lies in integrating with a real debugger such as pdb, so that you can run large Python programs, pause execution, and then visualize selected data structures (rather than all data structures in the program, which can get overwhelming).

Ok sorry that was mostly me thinking out loud.

}

Ha, I guess you can call this "Offline Python Tutor"!

## Optimize display of object-oriented programs (medium)

This is a good project for an object-oriented programming enthusiast.

Right now OPT naively visualizes all the steps that the Python interpreter takes when executing an
object-oriented program, which leads to all sorts of extraneous variables, frames, and pointers
lying around.

<a href="http://pythontutor.com/visualize.html#code=%23+Inheritance+-+object-oriented+programming+intro%0A%23+Adapted+from+MIT+6.01+course+notes+(Section+3.5)%0A%23+http%3A//mit.edu/6.01/mercurial/spring10/www/handouts/readings.pdf%0A%0Aclass+Staff601%3A%0A++++course+%3D+'6.01'%0A++++building+%3D+34%0A++++room+%3D+501%0A%0A++++def+giveRaise(self,+percentage)%3A%0A++++++++self.salary+%3D+self.salary+%2B+self.salary+*+percentage%0A%0Aclass+Prof601(Staff601)%3A%0A++++salary+%3D+100000%0A%0A++++def+__init__(self,+name,+age)%3A%0A++++++++self.name+%3D+name%0A++++++++self.giveRaise((age+-+18)+*+0.03)%0A%0A++++def+salutation(self)%3A%0A++++++++return+self.role+%2B+'+'+%2B+self.name%0A%0Apat+%3D+Prof601('Pat',+60)&mode=display&cumulative=false&py=2&curInstr=16">Click here for an example.</a>

This project involves cleaning up the execution trace so that object-oriented programs look
sensible when visualized.


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


## Create an OPT backend for a different programming language (hard)

This project is great for someone who likes to hack on language implementations and runtimes.

The OPT frontend can visualize programs written in any mainstream language, not just Python.
This project involves creating a backend for another language (e.g., Ruby, Java, JavaScript, C, C++, Scheme).
All the backend needs to do is to generate an execution trace in the following format ...

https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/opt-trace-format.md

... and the frontend should be able to visualize it!

For instance, the [Chicory Java trace generator for Daikon](http://groups.csail.mit.edu/pag/daikon/download/doc/daikon_manual_html/daikon_7.html#SEC69)
might be a good basis for writing a Java backend for OPT.

Also, my
[master's thesis](http://pgbovine.net/projects/pubs/guo-mixedlevel-mengthesis.pdf) from 2006
describes one possible technique for building a C-language backend based upon the [Valgrind](http://www.valgrind.org)
tool. More importantly, it describes the difficulties involved in creating a robust execution
trace generator for C and C++. It should be much easier to build a backend for a memory- and type-safe language, though :)


## Migrate OPT backend to Skulpt (very hard but super cool!)

This project is appropriate for someone with advanced knowledge of hacking a Python interpreter
who is willing to make a substantive time commitment.

Right now the OPT backend runs Python code on the server, but it would be super-cool to create a "backend"
that runs entirely in the browser. Modifying Skulpt -- http://www.skulpt.org/ -- is the leading contender here,
since I am in touch with its main developers.

The basic idea is to use Skulpt to generate a JavaScript trace object (all within the web browser without
a server call) and then construct a new ExecutionVisualizer with that trace object as a parameter.
Read "Direct embedding" and the associated code for more detailed info:
https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/embedding-HOWTO.md#direct-embedding


Main Advantages:
  - Enables fine-grained tracing of expression and sub-expression evaluation, which has clear pedagogical benefits; right now OPT can only single-step over one line at a time since it relies on the Python bdb debugger.
  - Enables an interactive REPL that incrementally takes in user inputs rather than just executing batch programs; this can lead to better interactivity and responsiveness.
  - Supports on-demand evaluation and in-memory storage of (relatively) large data structures such as a 100,000-element dictionary for a spell checker program; right now OPT must send that giant dictionary in a trace (encoded in an inefficient format).
  - Works in "offline mode" for students in regions without reliable Internet access

From an OPT user:
"The second idea came about when teaching about return values, but it applies to any "compound" expression that is more than a single function call or assignment of a literal to a variable.  I often find myself showing how Python processes a statement like "x = len(s) + 1" by showing how individual pieces are computed sequentially.  Right now, OPT treats that as a single, atomic line, so students don't see clearly how it first calls len(s), "replaces" that with its return value, performs the addition, and then stores the result of that into x.  I draw things like this on the board with underlining and arrows (e.g., "len(s)" is underlined, with an arrow pointing down to its return value) to show where data goes and how everything is evaluated.  I expect that could be automated and displayed in something like OPT.  I'm not sure I'm being clear, but I hope that makes some sense.  I recognize that this doesn't fit that well into the current model, which is focused on one step being one line of code, so it may be a bit of a pipe-dream."

Tips & Tricks:
  - From Brad Miller: http://blog.bonelakesoftware.com/2011/03/adding-module-to-skulpt.html and http://blog.bonelakesoftware.com/2011/02/python-in-your-browser-in-javascript.html
  - From Scott Graham, when I asked him whether Skulpt implements Python 2 or 3: “Mostly 2-ish. Some object hierarchy things take after 3's simplified semantics.”

Online Python Tutor
Copyright (C) 2010 Philip J. Guo (philip@pgbovine.net)
https://github.com/pgbovine/OnlinePythonTutor/

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

======
Introduction:

The Online Python Tutor is a web application where you can type Python
scripts directly into your web browser, execute those scripts, and
single-step FORWARDS AND BACKWARDS through execution in order to view
the run-time state of all data structures.

Using this tool, teachers and students can write small Python code
snippets together and see what happens to the data structures when the
code gets executed.

Try it out live at: http://www.onlinepythontutor.com/

======
System architecture overview:

The Online Python Tutor is implemented as a web application, with a
JavaScript front-end making AJAX calls to a pure-Python back-end.

The back-end has been tested on an Apache server running Python 2.5
through CGI.  Note that it will probably fail in subtle ways on other
Python 2.X (and will DEFINITELY fail on Python 3.X).  Peter Wentworth
has create a port to Python 3.X, and hopefully we can eventually
integrate his code into my repository.


The front-end is HTML/JavaScript (using the jQuery library).  It's
responsible for the input text box, submitting the Python code (as
plaintext) to the back-end, receiving an execution trace from the
back-end, and then rendering that trace as data structure
visualizations.  The front-end code resides in these files in the
current directory:

  tutor.html
  question.html
  edu-python.js
  edu-python-tutor.js
  edu-python-questions.js
  edu-python.css
  jquery.textarea.js
  .htaccess - to increase the size of allowed Apache HTTP responses

  (there are also other 3rd-party JavaScript library files)

Note on .htaccess: If your server limits the size of responses received
from HTTP requests, then you might need to use the following .htaccess
file included in your top-level (front-end) directory, to allow the
Online Python Tutor to receive traces from the back-end:

<IfModule mod_security.c>

# Set a ~2MB limit for response headers (bigger than default 512K limit)
SecResponseBodyLimit 2000000

</IfModule>


The back-end is a server-side CGI application that takes Python script
source code as input, executes the entire script (up to 200 executed
lines, to prevent infinite loops), and collects a full trace of all
variable values (i.e., data structures) after each line has been
executed.  It then sends that full trace to the front-end in a
specially-encoded JSON format.  The front-end then parses and visualizes
that trace and allows the user to single-step forwards AND backwards
through execution.

The back-end resides in the cgi-bin/ sub-directory in this repository:

  cgi-bin/web_exec.py     - the CGI entrance point to the back-end
  cgi-bin/web_run_test.py - the CGI entrance point to the question
                            grading back-end
  cgi-bin/pg_logger.py    - the 'meat' of the back-end
  cgi-bin/pg_encoder.py   - encodes Python data into JSON
  cgi-bin/demjson.py      - 3rd-party JSON module, since Python 2.5
                            doesn't have the built-in 'import json'
  cgi-bin/create_db.py    - for optional sqlite query logging
  cgi-bin/db_common.py    - for optional sqlite query logging
  cgi-bin/.htaccess       - for Apache CGI execute permissions


Due to the AJAX same-origin policy, the front-end and back-end must be
deployed on the same server (unless you do some fancy proxy magic).


======
Original founding vision (from January 2010):

I want to create a web-based interactive learning platform for students
to explore programming.  I envision an HTML UI where a student can enter
in code and then single-step through it and see how the data structures
change during execution.

Key insight: I realized that for the small programs that teachers and
students write for educational purposes, it's possible to simply LOG
everything that happens to data structures during execution.  Then we
can simply play back that log in the front-end, which allows
single-stepping forwards and also BACKWARDS.

After all, we don't need students to be able to interactive probe and
make changes in the middle of execution, which is the only value-added
of a REAL debugger.

What kinds of things do we want to log?

  On the execution of each line, log:
    - the line number just executed
    - all data created by the program

  Also log calls and returns of a student's function 
  (but NOT library functions)

We can use the Python JSON module to encode data structures in JSON and
send it to the client's web browser

The PDB debugger (Lib/pdb.py) is written in pure Python:
  http://docs.python.org/library/pdb.html
  - the bdb debugger framework is the C module that pdb calls
    http://docs.python.org/library/bdb.html


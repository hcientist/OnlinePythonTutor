export var privacyAndEndingHTML = `

<p style="margin-top: 30px;">Privacy Policy: By using Python Tutor, your
visualized code, options, user interactions, text chats, and IP address
are logged on our server and may be analyzed for research purposes.
Nearly all web services collect this basic information from users in
their server logs. However, Python Tutor does not collect any personally
identifiable information from its users. It uses Google Analytics for
website analytics.</p>

<p>Terms of Service: The Python Tutor service is provided for free on an
as-is basis. Use this service at your own risk. Do not use it to share
confidential information. The developers of Python Tutor are not
responsible for the chat messages or behaviors of any of the users on
this website. We are also not responsible for any damages caused by
using this website. Finally, it is your responsibility to follow
appropriate academic integrity standards.</p>

<p style="margin-top: 25px;">
Copyright &copy; <a href="http://www.pgbovine.net/">Philip Guo</a>.  All rights reserved.
</p>`;


export var footerHtml = `
<p>
  <button id="genUrlBtn" class="smallBtn" type="button">Generate permanent link</button> <input type="text" id="urlOutput" size="70"/>
</p>
<p>
  <button id="genUrlShortenedBtn" class="smallBtn" type="button">Generate shortened link</button> <input type="text" id="urlOutputShortened" size="25"/>
</p>

<p>Click above to create a permanent link to your
visualization (<a href="https://www.youtube.com/watch?v=h4q3UKdEFKE" target="_blank">video demo</a>). To report bugs, paste the link along with an error
description in an email to philip@pgbovine.net</p>

<div id="embedLinkDiv">
<p>
  <button id="genEmbedBtn" class="smallBtn" type="button">Generate embed code</button> <input type="text" id="embedCodeOutput" size="70"/>
</p>

<p>To embed this visualization in your webpage, click the 'Generate
embed code' button above and paste the resulting HTML code into your
webpage. Adjust the height and width parameters and
change the link to <b>https://</b> if needed.</p>
</div>

<p style="margin-top: 25px;">
<a href="http://pythontutor.com/">Python Tutor</a> (<a href="https://github.com/pgbovine/OnlinePythonTutor">code on GitHub</a>) supports seven
languages (despite its name!):</p>

<p>1. Python <a href="https://docs.python.org/2.7/">2.7</a> and <a
href="https://docs.python.org/3.6/">3.6</a> with these limited module
imports:

__future__, abc, array, bisect, calendar,
cmath, collections, copy, datetime, decimal,
doctest, fractions, functools, hashlib, heapq,
io, itertools, json, locale, math,
operator, pickle, pprint, random, re,
string, time, types, unittest, StringIO (Python 2), typing (Python 3).

(There is also an experimental version of Python 3.6 with <a
href="https://docs.anaconda.com/anaconda/">Anaconda</a>, which lets
you import many more modules.)

<a
href="https://github.com/pgbovine/OnlinePythonTutor/tree/master/v5-unity">Backend source code</a>.
</p>

<p>2. Java using Oracle's Java 8. The original <a
href="http://cscircles.cemc.uwaterloo.ca/java_visualize/">Java
visualizer</a> was created by <a href="https://github.com/daveagp">David Pritchard</a> and Will Gwozdz.
It supports
<code><a href="http://introcs.cs.princeton.edu/java/stdlib/javadoc/StdIn.html">StdIn</a></code>, 
<code><a href="http://introcs.cs.princeton.edu/java/stdlib/javadoc/StdOut.html">StdOut</a></code>, 
most other <a href="http://introcs.cs.princeton.edu/java/stdlib"><tt>stdlib</tt> libraries</a>,
<a href="http://introcs.cs.princeton.edu/java/43stack/Stack.java.html"><tt>Stack</tt></a>,
<a href="http://introcs.cs.princeton.edu/java/43stack/Queue.java.html"><tt>Queue</tt></a>,
and <a href="http://introcs.cs.princeton.edu/java/44st/ST.java.html"><tt>ST</tt></a>.
(To access Java's built-in <tt>Stack</tt>/<tt>Queue</tt> classes, write
<tt>import java.util.Stack;</tt> &mdash; note, <tt>import
java.util.*;</tt> won't work.)
<a
href="https://github.com/pgbovine/OnlinePythonTutor/tree/master/v4-cokapi/backends/java">Backend
source code</a>.</p>

<p>3. JavaScript ES6 running in Node.js v6.0.0. <a
href="https://github.com/pgbovine/OnlinePythonTutor/tree/master/v4-cokapi/backends/javascript">Backend
source code</a>.</p>

<p>4. <a href="http://www.typescriptlang.org">TypeScript</a> 1.4.1 running in Node.js v6.0.0. <a
href="https://github.com/pgbovine/OnlinePythonTutor/tree/master/v4-cokapi/backends/javascript">Backend
source code</a>.</p>

<p>5. Ruby 2 using MRI 2.2.2. <a
href="https://github.com/pgbovine/OnlinePythonTutor/tree/master/v4-cokapi/backends/ruby">Backend
source code</a>.</p>

<p>6. C using gcc 4.8, C11, and Valgrind Memcheck.
<a href="https://github.com/pgbovine/opt-cpp-backend">Backend source code</a>.</p>

<p>7. C++ using gcc 4.8, C++11, and Valgrind Memcheck.
<a href="https://github.com/pgbovine/opt-cpp-backend">Backend source code</a>.</p>
` + privacyAndEndingHTML;

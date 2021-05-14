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
<p style="margin-top: 20px; margin-bottom: 30px;"><a href="https://github.com/pgbovine/OnlinePythonTutor/blob/master/unsupported-features.md" target="_blank">unsupported features</a> |
<a href="https://www.youtube.com/watch?v=80ztTXP90Vs&list=PLzV58Zm8FuBL2WxxZKGZ6j1dH8NKb_HYI&index=5" target="_blank">setting breakpoints</a> |
<a href="https://www.youtube.com/watch?v=Mxt9HZWgwAM&list=PLzV58Zm8FuBL2WxxZKGZ6j1dH8NKb_HYI&index=6" target="_blank">hiding variables</a> |
<a href="https://www.youtube.com/watch?v=JjGt95Te0wo&index=3&list=PLzV58Zm8FuBL2WxxZKGZ6j1dH8NKb_HYI" target="_blank">live programming</a>
</p>

<p>
  <button id="genUrlBtn" class="smallBtn" type="button">Generate permanent link</button> <input type="text" id="urlOutput" size="60"/>
(<a href="https://www.youtube.com/watch?v=h4q3UKdEFKE" target="_blank">video demo</a>)
</p>

<div id="embedLinkDiv">
<p>
  <button id="genEmbedBtn" class="smallBtn" type="button">Generate embed code</button> <input type="text" id="embedCodeOutput" size="60"/> (also supports https://)
</p>
</div>

<p style="margin-top: 25px;">
<a href="http://pythontutor.com/">Python Tutor</a> (<a href="https://github.com/pgbovine/OnlinePythonTutor">code on GitHub</a>) supports:

Python <a href="https://docs.python.org/3.6/">3.6</a> and <a
href="https://docs.python.org/2.7/">2.7</a> with limited imports
(__future__, abc, array, bisect, calendar,
cmath, collections, copy, datetime, decimal,
doctest, fractions, functools, hashlib, heapq,
io, itertools, json, locale, math,
operator, pickle, pprint, random, re,
string, time, types, unittest, StringIO (Python 2), typing (Python 3)),

Oracle Java 8 (implemented by <a href="https://github.com/daveagp">David Pritchard</a> and Will Gwozdz,
supports
<code><a href="http://introcs.cs.princeton.edu/java/stdlib/javadoc/StdIn.html">StdIn</a></code>, 
<code><a href="http://introcs.cs.princeton.edu/java/stdlib/javadoc/StdOut.html">StdOut</a></code>, 
most other <a href="http://introcs.cs.princeton.edu/java/stdlib"><tt>stdlib</tt> libraries</a>,
<a href="http://introcs.cs.princeton.edu/java/43stack/Stack.java.html"><tt>Stack</tt></a>,
<a href="http://introcs.cs.princeton.edu/java/43stack/Queue.java.html"><tt>Queue</tt></a>,
and <a href="http://introcs.cs.princeton.edu/java/44st/ST.java.html"><tt>ST</tt></a>.
To access built-in <tt>Stack</tt>/<tt>Queue</tt> classes, write:
<tt>import java.util.Stack;</tt> This won't work: <tt>import
java.util.*;</tt>),

JavaScript ES6 and TypeScript 1.4.1 (Node.js v6.0.0), Ruby 2 (MRI 2.2.2), C and C++ (gcc 4.8, C11/C++11, Valgrind Memcheck)</p>

` + privacyAndEndingHTML;


export var nullTraceErrorLst = [
  "Unknown error: The server is OVERLOADED or your code has UNSUPPORTED FEATURES.",
  "Try again later. This site is free with NO available technical support. [#NullTrace]"
];

export var unsupportedFeaturesStr = 'see <a target="_blank" href="https://github.com/pgbovine/OnlinePythonTutor/blob/master/unsupported-features.md">UNSUPPORTED FEATURES</a>';

# Execution Trace Format

This document describes the execution trace format that serves as the
interface between the frontend and backend of Online Python Tutor
(thereafter abbreviated as OPT).

It is a starting point for anyone who wants to create a different
backend (e.g., for another programming language) or a different frontend
(e.g., for visually-impaired students). View it online at:

https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/opt-trace-format.md

Look at the Git history to see when this document was last updated; the
more time elapsed since that date, the more likely things are
out-of-date.

I'm assuming that you're competent in Python, JSON, command-line-fu, and
Google-fu. Feel free to email philip@pgbovine.net if you have questions.

And please excuse the sloppy writing; I'm not trying to win any style awards here :)


## Trace Overview

Before you continue reading, I suggest for you to first skim the Overview for Developers doc:
https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/developer-overview.md

(TODO: write me sometime!)

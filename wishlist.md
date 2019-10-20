# Wishlist for Python Tutor

This is a wishlist for new Python Tutor features, created by aggregating nearly a decade's worth of user survey responses, GitHub issues, other user feedback, and my own personal notes. Most items here will likely **never get implemented** due to my limited time and energy to devote to this project; I also don't have time to manage code contributions from others. This doc was originally created on 2019-10-20.

First read the [**unsupported features doc**](unsupported-features.md#read-this-first) to get a sense of what desired features are likely *not* listed here since they don't fit within Python Tutor's design philosophy.


## User Interface

### General

- unify the [regular](http://pythontutor.com/visualize.html) and [live programming](http://pythontutor.com/live.html) UIs into one, so that users don't need to switch back-and-forth between editing and visualizing code
  - (live programming can simply be a toggle switch in the unified UI)
- modernize the UI, make it more responsive and display better on mobile devices of various sizes (currently in [#unsupported](unsupported-features.md))
- internationalization/localization of the UI into other popular languages


### Code Editor

- cache the user's code in localStorage so that it's still there in case they accidentally close the browser window
  - more ambitious but doable would be to save to user's GitHub account or pull from Gists, as an easy form of cloud data storage
- more precisely underline syntax/compile errors in the editor if we have column/range information
- better error messages than what the default compilers/interpreters offer, by integrating more powerful static analysis or style checking tools
- flipping back-and-forth between edit and visualize modes can be annoying when the code is very long; it would be nice to save the vertical scroll position in the editor so the user can easily jump back to editing where they left off.
  - related: if there's a run-time error in the visualizer, then when they flip back to the editor, it could jump to the line where the error occurred
  - (these issues will disappear if we unify the regular and live programming UIs!)
- proactively warn the user when their code is likely too long or runs for too many steps, to nudge them toward either shortening it or using breakpoints (e.g., the Python #break annotation) to cut down on steps


### Visualizer

- better fonts in the visualizer's code display, to disambiguate letters like l, I, and 1
  - one user suggested Adobe's Source Code Pro.
  - (this issue will disappear if we unify the regular and live programming UIs!)
- red-green colorblindness may be an issue with the visualizer's arrows for prev/next line to execute
- step-by-step verbal or textual narrations of exactly what the code is doing at each execution step, and *why* it's doing that
  - the gold standard here is emulating what an instructor would *say* to explain each step, perhaps at different levels of abstraction/complexity for different learner audiences
  - my hunch is that annotating code with tagged comments denoting programmer intent or [variable roles](http://www.cs.joensuu.fi/~saja/var_roles/stud_vers/stud_Python_eng.html) could make these narrations more meaningful
  - could be great for low-vision accessibility too
- showing visualization diffs and animated transitions between consecutive steps so users can clearly see what changes occurred
  - goes hand-in-hand with the narrations feature above, since if we know what has changed, then we can narrate it (e.g., "a new element was added to the middle of this list")
  - more advanced: seeing execution diffs between two *different* executions of similar code, to compare the impacts of code changes on run-time state
- hiding elements by clicking on them, and remembering those hide options across different executions of similar code
  - especially useful for large function/class definitions, which are largely boilerplate and irrelevant to the core lessons of the code
  - June 2018: implemented a simpler version as #pythontutor_hide and #pythontutor_hide_type annotations for Python in [pg_logger.py](v5-unity/pg_logger.py) ([video demo](https://www.youtube.com/watch?v=Mxt9HZWgwAM&list=PLzV58Zm8FuBL2WxxZKGZ6j1dH8NKb_HYI&index=6))
- more advanced navigation through execution steps. e.g.,:
  - click a line of code to jump to where it is next executed
  - set breakpoints by clicking on gutter instead of directly on the code
  - debugger-style stepping into and out of function calls
- drag-and-drop of visualization elements to let the user define custom layouts, and then remembering those positions
- hover over stack frames and then highlight the code that contains the call site of that frame
  - (more generally, think about other hover-based cross-linking of compile- and run-time information in visualizations)


### Advanced Data Rendering

- displaying large data structures by summarizing or truncating them (e.g., [1, 2, ..., 998, 999, 1000]), with clickable expansions
- multiple custom views of the same underlying data. e.g.,:
  - C char arrays: view as strings or as encoded binary bytes?
  - Python 2 strings: view as text or as encoded binary bytes?
  - more extreme: a binary blob can represent, say, a JPEG image; should we decode and display it?
- more detailed visualizations of data structure element accesses or slices ([GitHub Issue](https://github.com/pgbovine/OnlinePythonTutor/issues/185))
- more advanced data structure displays, such as 2D matrices, bitmap images, trees, graphs, etc. of the sort covered by typical algorithms or data structures textbooks (e.g., CLRS or [AIMA](https://www.google.com/search?q=Artificial+Intelligence%3A+A+Modern+Approach&oq=Artificial+Intelligence%3A+A+Modern+Approach&aqs=chrome..69i57j69i60.2409j1j7&sourceid=chrome&ie=UTF-8))
- rendering data structures commonly used in data science or machine learning (e.g., tables, data frames, SQL-like operations, 2D plots showing points, lines, and curves)
  - for inspirations here, look at diagrams used in pandas, scikit-learn, and the R tidyverse
- better rendering of tree recursive algorithms (e.g., fibonacci, tree traversals), such as putting frames in an execution *tree* instead of linearizing them into a stack


## Live Help Mode

- server-side validation of all live mode interactions for better robustness and security
- help requester should have finer-grained moderation controls, such as controlling which other users should have permission to edit code
- auto-throttling of user actions (e.g., chats, code edits) to prevent disruption and server overload
- social features such as user accounts, profiles, reputation points, review ratings, incentives, gamification, etc. (unlikely since they go against the minimalist design philosophy of the service)


## Tutorials

- inline links to short video tutorials whenever the user makes a common error; could automatically detect context and suggest proper videos
  - (In Jan 2018 I started implementing a codcast record/replay "video" feature in [recorder.ts](v5-unity/js/recorder.ts) but haven't released it yet. I could use that to record a bunch of inline tutorials.)


## Language Backends

- upgrade language backends to newer versions of compilers/interpreters (doable but tedious since I need to re-test the backends with new language versions, which could surface subtle bugs)
- if there's an infinite loop (or execution runs too long), still trace and render the first 1,000 steps instead of just returning an error, so users can see which parts of their code led to the too-long execution
- implement *backend* breakpoints (like the Python #break annotation) for all other languages, so that overly-long execution traces don't get generated even for larger pieces of code
  - right now there are breakpoints in the frontend, but that doesn't help when the backend already executes for > 1,000 steps; we need breakpoints in the backend (likely implement as comment annotations or GUI clicks in the code editor gutter) to really clamp down on overly-long executions
  

## Other

- Changing the name of the site to something more language-agnostic, since it's about way more than Python by now. Python Tutor has a strong brand andn natural SEO at this point, so maybe keep that but then either have a more general umbrella project name or an "everything-else-tutor" for all other languages.

# Wishlist for Python Tutor

*Created: 2019-10-20*

This is a (disorganized!) wishlist for new Python Tutor features, created by aggregating nearly a decade's worth of user survey responses, GitHub issues, other user feedback, and my own personal notes. Unfortunately, most items here will likely **never get implemented** due to my limited time to devote to this project; I also don't have time to manage code contributions from others.

First read the [**unsupported features doc**](unsupported-features.md#read-this-first) to get a sense of what desired features are *not* listed here since they don't fit Python Tutor's core design philosophy. When I decide what new features to add, I mainly think about improving *what makes Python Tutor unique* rather than piling on generic features that other tools already have.


## User Interfaces

### General UI/UX

- unify the [regular](http://pythontutor.com/visualize.html) and [live programming](http://pythontutor.com/live.html) UIs into one, so that users don't need to switch back-and-forth between editing and visualizing code
  - we then need a clear indicator of when the visualization is "stale" (i.e., doesn't correspond to the currently-edited code)
  - live programming can simply be a toggle switch in the unified UI
- modernize the UI, make it more responsive and display better on mobile devices of various sizes
  - adjustable font sizes in both editor and visualizer
  - adjustable sizes for all widgets, and *remember* the user-adjusted sizes
  - on mobile, some users reported issues with writing or copy-pasting code in the editor (I only have iOS, maybe test on Android emulators/devices too)
    - from a bug report: 'In the mobile version we have to give a space before pressing enter, if not done then last symbol or alphabet will get removed'
- internationalization/localization of the UI into other popular languages
- dark mode UI
- change the name of the site to something more language-agnostic, since it's about way more than Python by now. Python Tutor has a strong brand and natural SEO at this point, so maybe keep that but then either have a more general umbrella project name or an "everything-else-tutor" for all other languages


### Code Editor

- cache the user's code in localStorage so that it's still there in case they accidentally close the browser window
  - more ambitious but doable would be to save to user's GitHub account or pull from Gists, as an easy form of cloud data storage; instructors can really benefit from this since they can save their lessons in GitHub
- more precisely underline syntax/compile errors in the editor if we have column/range information
- better error messages than what the default compilers/interpreters offer, by integrating more powerful static analysis or style checking tools
- it's a known problem that lots of users try to enter code that's too long and/or runs for too many steps. maybe offer suggestions for users to heuristically shorten their code
  - e.g., make certain variable values smaller for running loops fewer times, make strings shorter, numbers smaller, etc. to get at the heart of the algorithm at play
  - or encourage them to set breakpoints at certain places
  - this likely involves analyzing both the static code *and* the dynamic execution trace
- flipping back-and-forth between edit and visualize modes can be annoying when the code is very long; would be nice to save the vertical scroll position in the editor so the user can easily jump back to editing where they left off
  - related: whatever line you're currently seeing in the visualizer, when you switch back to editor jump directly to that line ([GitHub Issue](https://github.com/pgbovine/OnlinePythonTutor/issues/253))
  - (these issues will disappear if we unify the regular and live programming UIs!)
- IDE-like features like tab completion, code folding, etc.
- exposing a slider for undo/redo of edits; we already have undo/redo buttons in live help mode, so maybe extend that to always be activated
- upgrade Ace to a more modern version, or even move to Monaco (but TogetherJS works only with Ace for shared sessions)


### Visualizer

- better fonts in the visualizer's code display, to disambiguate letters like l, I, and 1
  - one user suggested Adobe's Source Code Pro.
  - (this issue will disappear if we unify the regular and live programming UIs!)
- red-green colorblindness may be an issue with the visualizer's arrows for prev/next line to execute
- step-by-step verbal or textual narrations of exactly what the code is doing at each execution step, and *why* it's doing that
  - the gold standard here is emulating what an instructor would *say* to explain each step, perhaps at different levels of abstraction/complexity for different learner audiences
  - my hunch is that annotating code with tagged comments denoting programmer intent or [variable roles](http://www.cs.joensuu.fi/~saja/var_roles/stud_vers/stud_Python_eng.html) could make these narrations more meaningful
  - could be great for low-vision accessibility too
  - [annotation bubbles](v3/opt-annotations.png) can help instructors hone in on specific parts of the visualization to explain at each step
- showing visualization diffs and animated transitions between consecutive steps so users can clearly see what changes occurred
  - could be shown via colors, arrows, and/or animations
  - could reduce the [split attention effect](https://en.wikipedia.org/wiki/Split_attention_effect) of learners needing to track the code on the left side and the changes to the visualization on the right side
  - goes hand-in-hand with the narrations feature above, since if we know what has changed, then we can narrate it (e.g., "a new element was added to the middle of this list")
- even better: seeing execution diffs between two *different* executions of similar code, to compare the impacts of specific code changes on run-time state
- hiding elements by clicking on them, and remembering those hide options across different executions of similar code
  - especially useful for large function/class/module/type definitions, which are largely boilerplate and irrelevant to the core lessons of the code
  - this can go a long way toward preventing information overload
  - June 2018: implemented a simpler version as #pythontutor_hide and #pythontutor_hide_type annotations for Python in [pg_logger.py](v5-unity/pg_logger.py) ([video demo](https://www.youtube.com/watch?v=Mxt9HZWgwAM&list=PLzV58Zm8FuBL2WxxZKGZ6j1dH8NKb_HYI&index=6))
- more advanced navigation through execution steps. e.g.,:
  - click a line of code to jump to where it is next executed
  - set breakpoints by clicking on gutter instead of directly on the code
  - debugger-style stepping into and out of function calls
- drag-and-drop of visualization elements to let the user define custom ad-hoc layouts, and then remembering those positions across similar executions
- hover over stack frames and then highlight the code that contains the call site of each frame
  - (more generally, think about other hover-based cross-linking of compile- and run-time information in visualizations)
- more detailed visualizations of data structure element accesses or slices ([GitHub Issue](https://github.com/pgbovine/OnlinePythonTutor/issues/185))
- displaying large data structures by summarizing or truncating them (e.g., [1, 2, ..., 999, 1000]), with clickable expansions
  - more generally, think about semantic zooming, overview+detail, or Table Lens (see Pirolli, Card, et al.)
  - could summarize as data visualizations like sparklines or summary tables (e.g., counts of commonly-occurring values)
  - or maybe even "zooming out" to the point where data structures appear as abbreviated plain-text representations to take focus off heap details
- better rendering of tree recursive algorithms (e.g., fibonacci, tree traversals), such as putting frames in an execution *tree* instead of linearizing them into a stack
- keyboard shortcuts for quick navigation (but watch out for keyboard focus issues)


### User Input

(Right now we support only text inputs using `input()` and `raw_input()` for Python.)

- running the same code repeatedly with different user inputs without flipping back-and-forth between edit and visualize modes (a unified UI would make this easier too!)
  - also the complement: if you change your code, be able to re-run it with the same set of user inputs so that you don't need to keep re-entering them
- lots of demand for C/C++ user inputs (and probably for other languages too!)
- also support command-line arguments via `argv[]` array
- support multi-line user inputs in a textarea
- pressing Enter to submit a user input instead of clicking 'Submit' button
- non-textual rich input widgets (see [v3 project ideas doc](v3/docs/project-ideas.md) for details):
  - interactive widget to draw mathematical graphs (e.g., nodes and edges); useful for visualizing graph/tree manipulation algorithms
  - 2-D canvas where the user can draw points and lines in a coordinate system; useful for visualizing simple computational geometry algorithms
  - 2-D matrix of numbers or colored blocks for, say, a Pac-Man world
  - drag and drop an image; useful for visualizing image manipulation algorithms
  - text box that represents a file on the filesystem, then I/O calls such as open, read, write, etc. would be intercepted and visualized as iterating (pointing) to the file object one line at a time


## Live Help Mode and Shared Sessions

- server-side validation of all shared sessions interactions for better robustness and security
- help requester should have finer-grained moderation controls, such as controlling which other users have permission to edit code
- auto-throttling of user actions (e.g., chats, code edits) to prevent disruption and server overload
- hide other users' cursors when they're not moving, since they sometimes occlude the code and chat
  - also an option to turn everyone's cursors off to remove clutter
- encourage the requester to fill in a tweet-length message about what they want help on, which would be displayed above their code editor; that way when someone new joins a room, they can get some immediate context
  - also, this doesn't show up on the help queue itself so it won't spam everyone on the site
- desktop notifications for both volunteers and requesters when something of note happens, like when someone enters a room or asks for help (so they can have Python Tutor open in a background tab and be doing other stuff while waiting)
  - maybe sound would work well here too if done tactfully
- social features such as user accounts, profiles, reputation points, review ratings, incentives, gamification, etc. (unlikely since they go against the minimalist design philosophy of the service)
- chat box is too small so requires too much scrolling around; would be great if resizable or fonts could be smaller
- chat window auto-scrolls whenever a new message comes in, which is annoying if you're scrolled upward trying to read older messages
- allow users entering public help sessions to view the full chat history
- have a volunteer lobby chat room where volunteers can hang out while waiting and maybe even coordinate with each other about who to help when new requests come onto the queue
  - but moderation would be harder in a lobby since nobody "owns" the session, unlike regular help request sessions
- concurrent editing in the Ace editor is a bit slow and clunky; also you can't see multiple edit cursors
- need some indicator that the chat session's original creator (i.e., the help requester) has left, so nobody in there is the original person (but it's OK for these sessions to still exist!)
- better server-side caching of user state, such as ipstack geolocation calls since we have a limited free monthly quota
- manually implement my own improved chat box feature and code editor syncing using another library (which doesn't tie me to Ace anymore)
  - that way, I use TogetherJS only for the shared cursors (which some users even find annoying!)
  - this will give me more flexibility without being constrained by TogetherJS's clunky implementations


## Language Backends

These features deal with the server-side backends that run the user's code.

- upgrade language backends to newer versions of compilers/interpreters (doable but tedious since I need to re-test the backends with new language versions, which could surface subtle bugs)
- if there's an infinite loop (or execution runs too long), still trace and render the first 1,000 steps instead of just returning an error, so users can see which parts of their code led to the too-long execution ([GitHub Issue](https://github.com/pgbovine/OnlinePythonTutor/issues/265))
- implement *backend* breakpoints (like the Python #break annotation) for all other languages, so that overly-long execution traces don't get generated even for larger pieces of code
  - right now there are breakpoints in the frontend, but that doesn't help when the backend already executes for > 1,000 steps; we need breakpoints in the backend (likely implemented as comment annotations or GUI clicks in the code editor gutter) to really clamp down on overly-long executions
- more reliable and faster server-side execution for non-Python backends


## Features for Instructors

The majority of Python Tutor users are learners, so I prioritize features that target them rather than those that mainly target instructors. Here are some common features that instructors want, though.


### Authoring Environments

I've thus far resisted going down this path since there are already so many great free programming lessons online.

- adding basic curricula, lessons, and practice problems to the site, powered by Python Tutor visualizations
  - authoring environment for creating custom lessons and exercises
  - these can take advantage of Python Tutor's unique features, such as asking questions about writing efficient code that finishes in less than N execution steps
- in Jan 2018 I started implementing a codcast record/replay "video" feature in [recorder.ts](v5-unity/js/recorder.ts) but haven't released it yet
  - I could use that to record a bunch of inline tutorials
    - could automatically detect coding context and suggest proper videos on concepts (e.g., while loops)
    - add inline links to short codcast video tutorials whenever the user makes a common error
  - can also create an authoring environment for instructors to make their own codcasts, and save them to, say, GitHub
- make an authoring environment using [annotation bubbles](v3/opt-annotations.png) to mark semantic meaning of data structures at each execution step (started prototyping this feature a longgg time ago)
  - this is a cruder non-video form of codcasts
  - they're more like "codewalks"
  - can also be used by learners to ask precisely-annotated questions to post on a forum like Stack Overflow
- allow instructors to add interactivity to visualizations, such as blanking out object values and making learners guess what value goes where, making learners drag and drop pointers to the right places, making them guess which line executes next, or other sorts of "micro-quizzes" to get learners more engaged


### Custom Data Rendering

The core issue here is that Python Tutor now has a fixed rendering algorithm (with a small set of toggle options), which I designed heuristically to meet [common introductory teaching use cases](unsupported-features.md#read-this-first). However, instructors in particular want more flexibility in what and how to render their data.

- define multiple custom views of the same underlying data. e.g.,:
  - C char arrays: view as strings or as encoded binary bytes?
  - C unions can be viewed in different ways
  - Python 2 strings: view as text or as encoded binary bytes?
  - objects: view as their constituent parts or as their "toString()"-like printed representations?
  - more extreme: a binary blob can represent, say, a JPEG image; should we decode and display it?
- define multiple linked representations: the ability to have one variable map to multiple visualization components.
  - This is useful for, say, an NLP dynamic programming algorithm where the code must both keep track of a parse tree and a 2-D matrix for the dynamic programming table, and both should update in unison.
- define more advanced data structure displays (see [v3 project ideas doc](v3/docs/project-ideas.md) for details):
  - e.g., 2-D matrices, 2-D microworlds like Pac-Man or Game of Life, bitmap images, trees, graphs, etc. of the sort covered by typical algorithms or data structures textbooks (e.g., CLRS or [AIMA](https://www.google.com/search?q=Artificial+Intelligence%3A+A+Modern+Approach&oq=Artificial+Intelligence%3A+A+Modern+Approach&aqs=chrome..69i57j69i60.2409j1j7&sourceid=chrome&ie=UTF-8))
  - e.g., a file object may be visualized as a text buffer with file location pointers; an automata object may be visualized as a Graphviz-like finite state machine; a pair of numerical arrays may be rendered as a scatterplot; a 2-D matrix of RGB values may be rendered as a bitmap image (e.g., for Media Computation); a symbolic math/formal-methods library data structure could be rendered in LaTeX format as mathematical equations
- rendering data structures commonly used in data science or machine learning (e.g., tables, data frames, SQL-like operations, 2-D plots showing points, lines, and curves)
  - for inspiration here, look at diagrams used in pandas, scikit-learn, and the R tidyverse
- custom rendering API: Right now Python Tutor renders data structures in a single, fixed way. However, different instructors have different preferences for how they want certain objects to render on-screen. There's currently no way for them to specify these custom rendering schemes without mucking around with intricate JavaScript code in the frontend. How can we make this easier?

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
- more precisely underline syntax/compile errors in the editor if we have column/range information
- better error messages than what the default compilers/interpreters offer, by integrating more powerful static analysis or style checking tools
- flipping back-and-forth betweetn edit and visualize modes can be annoying when the code is very long; it would be nice to save the vertical scroll position in the editor so the user can easily jump back to editing where they left off.
  - related: if there's a run-time error in the visualizer, then when they flip back to the editor, it could jump to the line where the error occurred
  - (these issues will disappear if we unify the regular and live programming UIs!)


### Visualizer

- better fonts in the visualizer's code display, to disambiguate letters like l, I, and 1. One user suggested Adobe's Source Code Pro.
  - (these issues will disappear if we unify the regular and live programming UIs!)
- red-green colorblindness may be an issue with the visualizer's arrows for prev/next line to execute
- step-by-step verbal or textual narration of exactly what the code is doing at each execution step, and what it means for the program
  - the gold standard is emulating what an instructor would *say* to explain each step, perhaps at different levels of abstraction/complexity for different learner audiences
  - my hunch is that annotating code with tagged comments denoting programmer intent or [variable roles](http://www.cs.joensuu.fi/~saja/var_roles/stud_vers/stud_Python_eng.html) could make these narrations more meaningful
  - could be great for low-vision accessibility too


## Live Help Mode

- server-side validation of all live mode interactions for better robustness and security
- help requester should have finer-grained moderation controls, such as controlling which other users should have permission to edit code
- auto-throttling of user actions (e.g., chats, code edits) to prevent disruption and server overload


## Tutorials

- inline links to short video tutorials whenever the user makes a common error; could automatically detect context and suggest proper videos
  - (In Jan 2018 I started implementing a codcast record/replay "video" feature in [recorder.ts](v5-unity/js/recorder.ts) but haven't released it yet. I could use that to record a bunch of inline tutorials.)


## Language Backends

- upgrade language backends to newer versions of compilers/interpreters (doable but tedious since I need to re-test the backends with new language versions, which could surface subtle bugs)
- if there's an infinite loop (or execution runs too long), still trace and render the first 1,000 steps instead of just returning an error, so users can see which parts of their code led to the too-long execution

## Other

- Changing the name of the site to something more language-agnostic, since it's about way more than Python by now. Python Tutor has a strong brand andn natural SEO at this point, so maybe keep that but then either have a more general umbrella project name or an "everything-else-tutor" for all other languages.

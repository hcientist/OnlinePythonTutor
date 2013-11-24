# Render static screenshots of Online Python Tutor visualizations

I've written a script that uses [PhantomJS](http://phantomjs.org/) to
create screenshots of Online Python Tutor data structure visualizations
as `.png` files.

For example, first [install PhantomJS](http://phantomjs.org/download.html) and then run:

    phantomjs render-opt-screenshots.js test.py

This will send `test.py` to Online Python Tutor and visualize all steps
as a set of `test.py.step.*.png` files.

Here are some example files:



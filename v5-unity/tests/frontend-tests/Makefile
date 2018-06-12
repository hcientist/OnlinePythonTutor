all:
	node run-all-tests.js

clobber:
	python copy_diffed_outs_to_golden.py

# remove all out files and diff files
clean:
	find . -name '*.out.png' | xargs rm
	find . -name '*.diff.png' | xargs rm

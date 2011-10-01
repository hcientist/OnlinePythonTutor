/* Copyright (c) 2006 Tony Garnock-Jones <tonyg@lshift.net>
 * Copyright (c) 2006 LShift Ltd. <query@lshift.net>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

function diff(file1, file2) {
    /* Text diff algorithm following Hunt and McIlroy 1976.
     * J. W. Hunt and M. D. McIlroy, An algorithm for differential file
     * comparison, Bell Telephone Laboratories CSTR #41 (1976)
     * http://www.cs.dartmouth.edu/~doug/
     *
     * Expects two arrays of strings.
     */

    var equivalenceClasses = {};
    for (var j = 0; j < file2.length; j++) {
	var line = file2[j];
	if (equivalenceClasses[line]) {
	    equivalenceClasses[line].push(j);
	} else {
	    equivalenceClasses[line] = [j];
	}
    }

    var candidates = [{file1index: -1,
		       file2index: -1,
		       chain: null}];

    for (var i = 0; i < file1.length; i++) {
	var line = file1[i];
	var file2indices = equivalenceClasses[line] || [];

	var r = 0;
	var c = candidates[0];

	for (var jX = 0; jX < file2indices.length; jX++) {
	    var j = file2indices[jX];

	    for (var s = 0; s < candidates.length; s++) {
		if ((candidates[s].file2index < j) &&
		    ((s == candidates.length - 1) ||
		     (candidates[s + 1].file2index > j)))
		    break;
	    }

	    if (s < candidates.length) {
		var newCandidate = {file1index: i,
				    file2index: j,
				    chain: candidates[s]};
		if (r == candidates.length) {
		    candidates.push(c);
		} else {
		    candidates[r] = c;
		}
		r = s + 1;
		c = newCandidate;
		if (r == candidates.length) {
		    break; // no point in examining further (j)s
		}
	    }
	}

	candidates[r] = c;
    }

    // At this point, we know the LCS: it's in the reverse of the
    // linked-list through .chain of
    // candidates[candidates.length - 1].

    // We now apply the LCS to build a "comm"-style picture of the
    // differences between file1 and file2.

    var result = [];
    var tail1 = file1.length;
    var tail2 = file2.length;
    var common = {common: []};

    function processCommon() {
	if (common.common.length) {
	    common.common.reverse();
	    result.push(common);
	    common = {common: []};
	}
    }

    for (var candidate = candidates[candidates.length - 1];
	 candidate != null;
	 candidate = candidate.chain) {
	var different = {file1: [], file2: []};

	while (--tail1 > candidate.file1index) {
	    different.file1.push(file1[tail1]);
	}

	while (--tail2 > candidate.file2index) {
	    different.file2.push(file2[tail2]);
	}

	if (different.file1.length || different.file2.length) {
	    processCommon();
	    different.file1.reverse();
	    different.file2.reverse();
	    result.push(different);
	}

	if (tail1 >= 0) {
	    common.common.push(file1[tail1]);
	}
    }

    processCommon();

    result.reverse();
    return result;
}

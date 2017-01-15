'''
Input:

- sys.argv[1] - filename of a doctest pickle file like lab1_doctests.pickle

Output:

- a JSON blob representing its contents, printed to stdout
'''

import cPickle
import sys
import json

if __name__ == "__main__":
    fullpath = sys.argv[1]
    assert fullpath.endswith(".pickle")
    with open(fullpath) as f:
        tests = cPickle.load(f)

        all_encoded_tests = []
        for t in tests:
            encoded_test = {}
            encoded_test['docstring'] = t.docstring
            encoded_test['name'] = t.name
            encoded_test['filename'] = t.filename
            encoded_examples = []
            encoded_test['examples'] = encoded_examples
            for e in t.examples:
                encoded_examples.append(
                    dict(source=e.source,
                         want=e.want,
                         options=e.options,
                         exc_msg=e.exc_msg))
            all_encoded_tests.append(encoded_test)

        print(json.dumps(all_encoded_tests, indent=2))

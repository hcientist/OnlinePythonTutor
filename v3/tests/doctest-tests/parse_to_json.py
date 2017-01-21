import ast
import json
import pprint
import pythonparser # requires regex module. try 'pip install pythonparser' or 'sudo pip install pythonparser'
import os
import sys

pp = pprint.PrettyPrinter()

class Visitor:
    def visit(self, obj, level=0):
        """Visit a node or a list of nodes. Other values are ignored"""
        if isinstance(obj, list):
            return [self.visit(elt, level) for elt in obj]

        elif isinstance(obj, pythonparser.ast.AST):
            typ = obj.__class__.__name__
            loc = None
            if hasattr(obj, 'loc'):
                loc = {
                    'start': {'line': obj.loc.begin().line(), 'column': obj.loc.begin().column()},
                    'end':   {'line': obj.loc.end().line(),   'column': obj.loc.end().column()}
                }
            # TODO: check out obj._locs for more details later if needed

            d = {}
            d['type'] = typ
            d['loc'] = loc
            for field_name in obj._fields:
                val = self.visit(getattr(obj, field_name), level+1)
                d[field_name] = val
            return d


if __name__ == "__main__":
    code = sys.argv[1] # can either pass in a string or a filename
    if os.path.isfile(code):
        code = open(sys.argv[1]).read()
    else:
        # make sure it ends with a newline to get parse() to work:
        if code[-1] != '\n':
            code += '\n'

    try:
        p = pythonparser.parse(code)

        v = Visitor()
        res = v.visit(p)
        print json.dumps(res)
    except pythonparser.diagnostic.Error as e:
        error_obj = {'type': 'parse_error'}
        diag = e.diagnostic
        loc = diag.location

        error_obj['loc'] = {
                    'start': {'line': loc.begin().line(), 'column': loc.begin().column()},
                    'end':   {'line': loc.end().line(),   'column': loc.end().column()}
        }

        error_obj['message'] = diag.message()
        print json.dumps(error_obj)
        sys.exit(1)

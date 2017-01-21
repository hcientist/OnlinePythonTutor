import ast
import json
import pprint
import pythonparser # requires regex module. try 'pip install pythonparser' or 'sudo pip install pythonparser'
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
                    'end':   {'line': obj.loc.end().line(), 'column': obj.loc.end().column()}
                }
            #print '  ' * level + typ + ' ' + str(obj._fields) + ' ' + str(obj._locs)
            #print '  ' * level, loc

            d = {}
            d['type'] = typ
            d['loc'] = loc
            for field_name in obj._fields:
                val = self.visit(getattr(obj, field_name), level+1)
                d[field_name] = val
            return d


if __name__ == "__main__":
    try:
        p = pythonparser.parse(open(sys.argv[1]).read(), filename=sys.argv[1])
    except pythonparser.Error as e:
        print e

    v = Visitor()
    res = v.visit(p)
    print json.dumps(res, indent=2)

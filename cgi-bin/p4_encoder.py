#!/usr/bin/python3 -u

# Python 3 version of encoder by David Pritchard, built upon work by Peter Wentworth
# (diff with pg_encoder.py, which is for Python 2)


# given an arbitrary piece of Python data, encode it in such a manner
# that it can be later encoded into JSON.
#   http://json.org/
#
# Format:
#   * None, int, float, str, bool - unchanged  (long is removed in Python 3)
#     (json.dumps encodes these fine verbatim)
#   * list     - ['LIST', unique_id, elt1, elt2, elt3, ..., eltN]
#   * tuple    - ['TUPLE', unique_id, elt1, elt2, elt3, ..., eltN]
#   * set      - ['SET', unique_id, elt1, elt2, elt3, ..., eltN]
#   * dict     - ['DICT', unique_id, [key1, value1], [key2, value2], ..., [keyN, valueN]]
#   * instance - ['INSTANCE', class name, unique_id, [attr1, value1], [attr2, value2], ..., [attrN, valueN]]
#   * class    - ['CLASS', class name, unique_id, [list of superclass names], [attr1, value1], [attr2, value2], ..., [attrN, valueN]]
#   * circular reference - ['CIRCULAR_REF', unique_id]
#   * other    - [<type name>, unique_id, string representation of object]
#
#
# the unique_id is derived from id(), which allows us to explicitly
# capture aliasing of compound values

# Key: real ID from id()
# Value: a small integer for greater readability, set by cur_small_id
real_to_small_IDs = {}
cur_small_id = 1

import re, types
#typeRE = re.compile("<type '(.*)'>")                 # not used in Python 3
classRE = re.compile("<class '(.*)'>")
functionRE = re.compile("<function (\w*) (.*)>")      # new case for Python 3

# When we find a <class x> and x is in this list, don't confuse the beginner by listing the inner details
native_types = ['int', 'float', 'str', 'tuple', 'list', 'set', 'dict', 'bool', 'NoneType', 'bytes', 'type', 'object']

def encode(dat, ignore_id=False):

  def append_attributes(ret, new_compound_obj_ids, dict):
      """ Put attributes onto ret.   """
      # traverse the __dict__ to grab attributes
      # (filter out useless-seeming ones):

      user_attrs = sorted([e for e in dict.keys()
              if e not in {'__doc__', '__module__', '__return__', '__locals__',
                           '__weakref__', '__dict__'}
                         ])
      for attr in user_attrs:
        foo = [encode_helper(attr, new_compound_obj_ids),
               encode_helper(dict[attr], new_compound_obj_ids)]
        ret.append(foo)

  def encode_helper(dat, compound_obj_ids):
    # primitive type
    if dat is None or  type(dat) in (int, float, str, bool):
      return dat
    # compound type
    else:
      my_id = id(dat)

      global cur_small_id
      if my_id not in real_to_small_IDs:
        if ignore_id:
          real_to_small_IDs[my_id] = 99999
        else:
          real_to_small_IDs[my_id] = cur_small_id
        cur_small_id += 1

      if my_id in compound_obj_ids:
        return ['CIRCULAR_REF', real_to_small_IDs[my_id]]

      new_compound_obj_ids = compound_obj_ids.union([my_id])

      typ = type(dat)
      obj_as_string = object.__repr__(dat)

      my_small_id = real_to_small_IDs[my_id]

      if typ == list:
        ret = ['LIST', my_small_id]
        for e in dat: ret.append(encode_helper(e, new_compound_obj_ids))
      elif typ == tuple:
        ret = ['TUPLE', my_small_id]
        for e in dat: ret.append(encode_helper(e, new_compound_obj_ids))
      elif typ == set:
        ret = ['SET', my_small_id]
        for e in dat: ret.append(encode_helper(e, new_compound_obj_ids))
      elif typ == dict:
        ret = ['DICT', my_small_id]
        append_attributes(ret, new_compound_obj_ids, dat)

      elif typ == type:    # its a class.  What a mess they made of it!
            superclass_names = [e.__name__ for e in dat.__bases__]
            ret = ['CLASS', dat.__name__, my_small_id, superclass_names]
            if dat.__name__ not in native_types:
                if hasattr(dat, '__dict__'):
                    append_attributes(ret, new_compound_obj_ids, dat.__dict__)

      elif repr(typ)[:6] == "<class" and obj_as_string.find('object') >= 0:    # is it  an instance?
            ret = ['INSTANCE', dat.__class__.__name__, my_small_id]
            if hasattr(dat, '__dict__'):
                append_attributes(ret, new_compound_obj_ids, dat.__dict__)

      else:
        typeStr = repr(typ)
        m = classRE.match(typeStr)
        assert m, typ
        ret = [m.group(1), my_small_id , obj_as_string]

      return ret

  return encode_helper(dat, set())


if __name__ == '__main__':

    def test(actual, expected=0):
        """ Compare the actual to the expected value, and print a suitable message. """
        import sys
        linenum = sys._getframe(1).f_lineno         # get the caller's line number.
        if (expected == actual):
            msg = "Test on line %s passed." % (linenum)
        else:
            msg = "Test on line %s failed. Expected '%s', but got '%s'." % (linenum, expected, actual)
        print(msg)

    class P():
        p_attr1 = 123
        def p_method(self, x):
            return 2*x

    class Q(P):
        pass

    p1 = P()
    q1 = Q()

    addr = 1

    test(encode("hello"),"hello")
    test(encode(123),123)
    test(encode(123.45),123.45)
    test(encode(132432134423143132432134423143),132432134423143132432134423143)
    test(encode(False),False)
    test(encode(None),None)


    test(encode((1,2)), ['TUPLE', addr, 1, 2])

    addr += 1
    test(encode([1,2]), ['LIST', addr, 1, 2])

    addr += 1
    test(encode({1:'mon'}), ['DICT', addr, [1, 'mon']])

    addr += 1
    test(encode(test), ['function', addr, 'test'])

    addr += 1
    test(encode(P), ['CLASS', 'P', addr, ['object'], ['p_attr1', 123], ['p_method', ['function', addr+1, 'p_method']]])

    addr += 2
    test(encode(Q), ['CLASS', 'Q', addr, ['P']])

    addr += 1
    test(encode(p1), ['INSTANCE', 'P', addr])

    addr += 1
    test(encode(q1), ['INSTANCE', 'Q', addr])

    addr += 1
    test(encode(min), ['builtin_function_or_method', addr, '<built-in function min>'] )

    addr += 1
    test(encode(range(1,3)), ['range', addr, 'range(1, 3)'])

    addr += 1
    test(encode({1,2}), ['SET', addr, 1, 2])

    addr += 1
    p = [1,2,3]
    p.append(p)   # make a circular reference

    test(encode(p), ['LIST', addr, 1, 2, 3, ['CIRCULAR_REF', addr]])

# Need some new tests for  z = type(123)


    print(encode({"stdout": "", "func_name": "<module>", "globals": {"sum": 0, "friends": ["LIST", 1, "Joe", "Bill"], "length": 3, "f": "Joe"}, "stack_locals": [], "line": 7, "event": "step_line"}))

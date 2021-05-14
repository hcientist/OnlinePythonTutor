# Online Python Tutor
# https://github.com/pgbovine/OnlinePythonTutor/
# 
# Copyright (C) 2010-2012 Philip J. Guo (philip@pgbovine.net)
# 
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to
# the following conditions:
# 
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
# OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
# CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
# TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


# Given an arbitrary piece of Python data, encode it in such a manner
# that it can be later encoded into JSON.
#   http://json.org/
#
# We use this function to encode run-time traces of data structures
# to send to the front-end.
#
# Format:
#   * None, int, long, float, str, bool - unchanged
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
# the unique_id is derived from id(), which allows us to explicitly
# capture aliasing of compound values

# Key: real ID from id()
# Value: a small integer for greater readability, set by cur_small_id
real_to_small_IDs = {}
cur_small_id = 1

import re, types
typeRE = re.compile("<type '(.*)'>")
classRE = re.compile("<class '(.*)'>")

def encode(dat, ignore_id=False):
  def encode_helper(dat, compound_obj_ids):
    # primitive type
    if dat is None or \
       type(dat) in (int, long, float, str, bool):
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
        for (k,v) in dat.iteritems():
          # don't display some built-in locals ...
          if k not in ('__module__', '__return__'):
            ret.append([encode_helper(k, new_compound_obj_ids), encode_helper(v, new_compound_obj_ids)])
      elif typ in (types.InstanceType, types.ClassType, types.TypeType) or \
           classRE.match(str(typ)):
        # ugh, classRE match is a bit of a hack :(
        if typ == types.InstanceType or classRE.match(str(typ)):
          ret = ['INSTANCE', dat.__class__.__name__, my_small_id]
        else:
          superclass_names = [e.__name__ for e in dat.__bases__]
          ret = ['CLASS', dat.__name__, my_small_id, superclass_names]

        # traverse inside of its __dict__ to grab attributes
        # (filter out useless-seeming ones):
        user_attrs = sorted([e for e in dat.__dict__.keys() 
                             if e not in ('__doc__', '__module__', '__return__')])

        for attr in user_attrs:
          ret.append([encode_helper(attr, new_compound_obj_ids), encode_helper(dat.__dict__[attr], new_compound_obj_ids)])
      else:
        typeStr = str(typ)
        m = typeRE.match(typeStr)
        assert m, typ
        ret = [m.group(1), my_small_id, str(dat)]

      return ret

  return encode_helper(dat, set())


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
#   Primitives:
#   * None, int, long, float, str, bool - unchanged
#     (json.dumps encodes these fine verbatim)
#
#   Compound objects:
#   * list     - ['LIST', elt1, elt2, elt3, ..., eltN]
#   * tuple    - ['TUPLE', elt1, elt2, elt3, ..., eltN]
#   * set      - ['SET', elt1, elt2, elt3, ..., eltN]
#   * dict     - ['DICT', [key1, value1], [key2, value2], ..., [keyN, valueN]]
#   * instance - ['INSTANCE', class name, [attr1, value1], [attr2, value2], ..., [attrN, valueN]]
#   * class    - ['CLASS', class name, [list of superclass names], [attr1, value1], [attr2, value2], ..., [attrN, valueN]]
#   * function - ['FUNCTION', function name, parent frame ID (for nested functions)]
#   * other    - [<type name>, string representation of object]
#   * compound object reference - ['REF', target object's unique_id]
#
# the unique_id is derived from id(), which allows us to capture aliasing


import re, types
typeRE = re.compile("<type '(.*)'>")
classRE = re.compile("<class '(.*)'>")

import inspect


# Note that this might BLOAT MEMORY CONSUMPTION since we're holding on
# to every reference ever created by the program without ever releasing
# anything!
class ObjectEncoder:
  def __init__(self):
    # Key: canonicalized small ID
    # Value: encoded (compound) heap object
    self.encoded_heap_objects = {}

    self.id_to_small_IDs = {}
    self.cur_small_ID = 1


  def get_heap(self):
    return self.encoded_heap_objects


  def reset_heap(self):
    # VERY IMPORTANT to reassign to an empty dict rather than just
    # clearing the existing dict, since get_heap() could have been
    # called earlier to return a reference to a previous heap state
    self.encoded_heap_objects = {}

  def set_function_parent_frame_ID(self, ref_obj, enclosing_frame_id):
    assert ref_obj[0] == 'REF'
    func_obj = self.encoded_heap_objects[ref_obj[1]]
    assert func_obj[0] == 'FUNCTION'
    func_obj[-1] = enclosing_frame_id


  # return either a primitive object or an object reference;
  # and as a side effect, update encoded_heap_objects
  def encode(self, dat):
    # primitive type
    if dat is None or \
       type(dat) in (int, long, float, str, bool):
      return dat

    # compound type - return an object reference and update encoded_heap_objects
    else:
      my_id = id(dat)

      try:
        my_small_id = self.id_to_small_IDs[my_id]
      except KeyError:
        my_small_id = self.cur_small_ID
        self.id_to_small_IDs[my_id] = self.cur_small_ID
        self.cur_small_ID += 1

      del my_id # to prevent bugs later in this function

      ret = ['REF', my_small_id]

      # punt early if you've already encoded this object
      if my_small_id in self.encoded_heap_objects:
        return ret


      # major side-effect!
      new_obj = []
      self.encoded_heap_objects[my_small_id] = new_obj

      typ = type(dat)

      if typ == list:
        new_obj.append('LIST')
        for e in dat: new_obj.append(self.encode(e))
      elif typ == tuple:
        new_obj.append('TUPLE')
        for e in dat: new_obj.append(self.encode(e))
      elif typ == set:
        new_obj.append('SET')
        for e in dat: new_obj.append(self.encode(e))
      elif typ == dict:
        new_obj.append('DICT')
        for (k, v) in dat.iteritems():
          # don't display some built-in locals ...
          if k not in ('__module__', '__return__'):
            new_obj.append([self.encode(k), self.encode(v)])

      elif typ in (types.InstanceType, types.ClassType, types.TypeType) or \
           classRE.match(str(typ)):
        # ugh, classRE match is a bit of a hack :(
        if typ == types.InstanceType or classRE.match(str(typ)):
          new_obj.extend(['INSTANCE', dat.__class__.__name__])
        else:
          superclass_names = [e.__name__ for e in dat.__bases__]
          new_obj.extend(['CLASS', dat.__name__, superclass_names])

        # traverse inside of its __dict__ to grab attributes
        # (filter out useless-seeming ones):
        user_attrs = sorted([e for e in dat.__dict__.keys() 
                             if e not in ('__doc__', '__module__', '__return__')])

        for attr in user_attrs:
          new_obj.append([self.encode(attr), self.encode(dat.__dict__[attr])])
      elif typ in (types.FunctionType, types.MethodType):
        # NB: In Python 3.0, getargspec is deprecated in favor of getfullargspec
        argspec = inspect.getargspec(dat)

        printed_args = [e for e in argspec.args]
        if argspec.varargs:
          printed_args.extend(['*' + e for e in argspec.varargs])
        if argspec.keywords:
          printed_args.extend(['**' + e for e in argspec.keywords])

        pretty_name = dat.__name__ + '(' + ', '.join(printed_args) + ')'
        new_obj.extend(['FUNCTION', pretty_name, None]) # the final element will be filled in later
      else:
        typeStr = str(typ)
        m = typeRE.match(typeStr)
        assert m, typ
        new_obj.extend([m.group(1), str(dat)])

      return ret


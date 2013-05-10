# TODO: how do you set the BACKGROUND COLOR of a GraphViz node ... fill=?

# TODO: make this work in both Python 2 and 3

from collections import defaultdict

import GChartWrapper
import html_module

import sys
is_python3 = (sys.version_info[0] == 3)

if is_python3:
  import io as cStringIO
else:
  import cStringIO

ID = 0

class TNode:
  def __init__(self, dat, left=None, right=None):
    self.data = dat
    self.left = left
    self.right = right

    self.__penwidth = 1 # thickness of node border

    # HTML-like RGB hex values - e.g., "#bb0000"
    self.__color = None # border color
    self.__fill = None  # internal node color

    # assign unique IDs in node creation order
    global ID
    self.id = 'n' + str(ID)
    ID += 1

  def set_border_color(self, col):
    self.__color = col

  def set_fill(self, col):
    self.__fill = col

  def set_width(self, w):
    assert w > 0
    self.__penwidth = w

  def highlight(self):
    self.__color = 'red'
    self.__penwidth = 2

  def reset_style(self):
    self.__color = None
    self.__fill = None
    self.__penwidth = 1

  def is_leaf(self):
    return not (self.left or self.right)

  def graphviz_str(self):
    ret = '%s[label="%s"' % (self.id, str(self.data)) # convert to str() for display
    if self.__penwidth > 1:
      ret += ',penwidth=%d' % self.__penwidth
    if self.__color:
      ret += ',color="%s"' % self.__color
    if self.__fill:
      ret += ',fill="%s"' % self.__fill
    ret += ']'
    return ret

  def __str__(self):
    return 'TNode(%s)' % repr(self.data)


  # render a binary tree of TNode objects starting at self in a pretty
  # GraphViz format using the balanced tree hack from
  # http://www.graphviz.org/content/FaqBalanceTree
  def graphviz_render(self, ios, compress=False):
    separator = '\n'
    if compress:
      separator=','
    ios.write('digraph G{')

    if not compress:
      ios.write('\n')
    
    queue = [] # each element is (node, level #)

    # Key: level number
    # Value: sorted list of node IDs at that level (including phantom nodes)
    nodes_by_level = defaultdict(list)


    def render_phantom(parent_id, suffix):
      phantom_id = parent_id + '_phantom_' + suffix
      ios.write('%s [label="",width=.1,style=invis]%s' % (phantom_id, separator))
      ios.write('%s->%s [style=invis]%s' % (parent_id, phantom_id, separator))
      return phantom_id

    def bfs_visit():
      # base case
      if not queue:
        return

      n, level = queue.pop(0)

      ios.write(n.graphviz_str() + separator) # current node
      if n.left or n.right:
        if n.left:
          ios.write('%s->%s%s' % (n.id, n.left.id, separator))
          queue.append((n.left, level+1))
          nodes_by_level[level+1].append(n.left.id)
        else:
          # insert phantom to make tree look good
          ph_id = render_phantom(n.id, 'L')
          nodes_by_level[level+1].append(ph_id)

        # always insert invisible middle phantom
        ph_id = render_phantom(n.id, 'M')
        nodes_by_level[level+1].append(ph_id)

        if n.right:
          ios.write('%s->%s%s' % (n.id, n.right.id, separator))
          queue.append((n.right, level+1))
          nodes_by_level[level+1].append(n.right.id)
        else:
          # insert phantom to make tree look good
          ph_id = render_phantom(n.id, 'R')
          nodes_by_level[level+1].append(ph_id)

      bfs_visit() # recurse!

    queue.append((self, 1))
    bfs_visit()

    if not compress:
      ios.write('\n')

    # make sure all nodes at the same level are vertically aligned
    for level in nodes_by_level:
      node_ids = nodes_by_level[level]
      if len(node_ids) > 1:
        ios.write(('{rank=same %s [style=invis]}' % '->'.join(node_ids)) + separator)

    ios.write('}') # cap it off


  def to_graphviz_string(self):
    s = cStringIO.StringIO()
    self.graphviz_render(s, True)
    return s.getvalue()

  def to_graphviz_img(self):
    return GChartWrapper.GraphViz(self.to_graphviz_string())


if __name__ == "__main__":
  # simple test tree
  r = TNode('a',
            left=TNode('b0',
                       left=TNode('c0',
                                  right=TNode('d1')),
                       right=TNode('c1',
                                   left=TNode('d3'),
                                   right=TNode('d4'))),
            right=TNode('b1',
                        left=TNode('c2',
                                   left=TNode('d2'))))

  f = open('test.dot', 'w')
  r.graphviz_render(f)
  f.close()
  #print(to_graphviz_string(a))

'''
/* balanced tree hack from http://www.graphviz.org/content/FaqBalanceTree */

/*
digraph G {
  a -> b0
  xb [label="",width=.1,style=invis]
  a -> xb [style=invis]
  a -> b1

  {rank=same b0 -> xb -> b1 [style=invis]}

  b0 -> c0
  xc [label="",width=.1,style=invis]
  b0 -> xc [style=invis]
  b0 -> c1

  {rank=same c0 -> xc -> c1 [style=invis]}
}
*/
'''

'''
from bintree_module import TNode
import html_module

r = TNode('a',
          left=TNode('b0',
                     left=TNode('c0',
                                right=TNode('d1')),
                     right=TNode('c1',
                                 left=TNode('d3'),
                                 right=TNode('d4'))),
          right=TNode('b1',
                      left=TNode('c2')))

def highlight_and_display(root):
    def f(node):
        node.highlight()
        html_module.display_img(root.to_graphviz_img()) #break
        node.reset_style()
    return f

def preorder(t, visitfn):
    if not t:
        return
    visitfn(t)
    preorder(t.left, visitfn)
    preorder(t.right, visitfn)

preorder(r, highlight_and_display(r))
'''


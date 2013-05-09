# TODO: how do you set the BACKGROUND COLOR of a GraphViz node ... fill=?

# TODO: make this work in both Python 2 and 3

from collections import defaultdict

import sys
is_python3 = (sys.version_info[0] == 3)

if is_python3:
  import io as cStringIO
else:
  import cStringIO

ID = 0

class TreeNode:
  def __init__(self, dat):
    self.data = str(dat) # convert to string for easy display in GraphViz
    self.parent = None
    self.left = None
    self.right = None

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

  def __str__(self):
    ret = '%s[label="%s"' % (self.id, self.data)
    if self.__penwidth > 1:
      ret += ',penwidth=%d' % self.__penwidth
    if self.__color:
      ret += ',color="%s"' % self.__color
    if self.__fill:
      ret += ',fill="%s"' % self.__fill
    ret += ']'
    return ret


# render a binary tree of TreeNode objects starting at root in a pretty
# GraphViz format using the balanced tree hack from
# http://www.graphviz.org/content/FaqBalanceTree
def graphviz_render(root, ios, compress=False):
  separator = '\n'
  if compress:
    separator=','
  ios.write('digraph G{')
  
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

    ios.write(str(n) + separator) # current node
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

  queue.append((root, 1))
  bfs_visit()

  if not compress:
    ios.write('\n')

  # make sure all nodes at the same level are vertically aligned
  for level in nodes_by_level:
    node_ids = nodes_by_level[level]
    if len(node_ids) > 1:
      ios.write(('{rank=same %s [style=invis]}' % '->'.join(node_ids)) + separator)

  ios.write('}') # cap it off


def to_graphviz_string(root):
  s = cStringIO.StringIO()
  graphviz_render(root, s, True)
  return s.getvalue()

COUNT = 0
def preorder_traversal(root, n):
  if not n: return

  global COUNT
  f = open('preorder_' + str(COUNT) + '.dot', 'w')
  n.highlight()
  graphviz_render(root, f)
  n.reset_style()
  f.close()
  COUNT += 1

  preorder_traversal(root, n.left)
  preorder_traversal(root, n.right)


# TODO: add a function to create a tree from a nested list/tuple

if __name__ == "__main__":
  # simple test tree
  a = TreeNode('a')

  b0 = TreeNode('b0')
  a.left = b0

  b1 = TreeNode('b1')
  a.right = b1

  c0 = TreeNode('c0')
  b0.left = c0

  c1 = TreeNode('c1')
  b0.right = c1

  c2 = TreeNode('c2')
  b1.left = c2

  d1 = TreeNode('d1')
  c0.right = d1

  d2 = TreeNode('d2')
  c2.left = d2

  d3 = TreeNode('d3')
  c1.left = d3

  d4 = TreeNode('d4')
  c1.right = d4

  #f = open('test.dot', 'w')
  #graphviz_render(a, f, True)
  #f.close()
  print to_graphviz_string(a)

  #preorder_traversal(a, a)


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
from bintree_module import TreeNode, to_graphviz_string
import GChartWrapper
import html_module

a = TreeNode('a')
b0 = TreeNode('b0')
a.left = b0
b1 = TreeNode('b1')
a.right = b1
c0 = TreeNode('c0')     
b0.left = c0            
c1 = TreeNode('c1')
b0.right = c1
c2 = TreeNode('c2')
b1.left = c2
d1 = TreeNode('d1')    
c0.right = d1          

html_module.display_img(GChartWrapper.GraphViz(to_graphviz_string(a)))
'''

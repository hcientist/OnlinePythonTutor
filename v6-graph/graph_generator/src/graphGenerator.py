import sys
import time
import pygraphviz as pgv


#Call graph function generator
#blue for functions defined on user program
# green for functions of pythons libraries
def callGraph(graph):
    g = pgv.AGraph(strict=True, directed=True)
    for function1 in graph:
        if function1 not in g:
            # it's a function defined
            if function1.endswith(')'):
                g.add_node(function1, style="filled", fillcolor='lightblue')
            else:
                g.add_node(function1, style="filled", fillcolor='greenyellow')
        for function2 in graph[function1]:
            if function2 not in g:
                # it's a function defined
                if function2.endswith(')'):
                    g.add_node(function2, style="filled", fillcolor='lightblue')
                else:
                    g.add_node(function2, style="filled", fillcolor='greenyellow')
            g.add_edge(function1, function2)
    g.layout(prog='dot')
    res = "callgraph"+time.asctime(time.localtime(time.time()))+".png"
    g.draw(res)
    return res


# returns position of previous for or while
def checkBetween(prev, fro, to):
    while fro >= to:
        if "for" in prev[fro] or "while" in prev[fro]:
            return fro
        fro -= 1
    return -1


# generates control flow graph
def controlGraph(graph, function):
    control = graph[function]
    g = pgv.AGraph(strict=True, directed=True)
    prev = {}
    nbody = -1
    for (body, type, value) in control:
        g.add_node(value)
        # first entry
        if nbody == -1:
            nbody += 1
            prev[nbody] = value
        else:
            if "continue" in value:
                if "if" in prev[nbody] or "elif" in prev[nbody]:
                    g.add_edge(prev[nbody], value, color="green")
                else:
                    g.add_edge(prev[nbody], value)
                # conect to previous loop
                tmp = checkBetween(prev, body-1, 0)
                g.add_edge(value, prev[tmp])
                nbody = body
            elif "break" in value:
                if "if" in prev[nbody] or "elif" in prev[nbody]:
                    g.add_edge(prev[nbody], value, color="green")
                else:
                    g.add_edge(prev[nbody], value)
                nbody = body
            # continuous flow
            elif nbody == body:
                g.add_edge(prev[nbody], value)
                prev[nbody] = value
            # enters a loop/conditional body
            elif nbody < body:
                if "else" not in prev[nbody]:
                    g.add_edge(prev[nbody], value, color="green")
                else:
                    g.add_edge(prev[nbody], value)
                nbody += 1
                prev[nbody] = value
            # exits a loop/conditional body
            else:
                n = nbody
                con = 0
                while nbody > body:
                    nbody -= 1
                    # check if stmt was inside a loop
                    if con == 0 and ("for" in prev[nbody] or "while" in prev[nbody]):
                        g.add_edge(prev[n], prev[nbody])
                        con = 1
                if "else" not in prev[nbody]:
                    g.add_edge(prev[nbody], value, color="red", arrowhead="onormal")
                prev[nbody] = value
    prev = {}
    i = 0
    # create missing edges
    while i < len(control):
        tupple = control[i]
        v = g.get_node(tupple[2])
        depth = tupple[0]
        prev[depth] = tupple[2]
        if "break" in tupple[2]:
            # body of last loop
            tmp = checkBetween(prev, depth-1, 0)
            j = i+1
            while j < len(control):
                tupple2 = control[j]
                if tupple2[0] <= tmp and "else" not in tupple2[2]:
                    g.add_edge(tupple[2], tupple2[2])
                    break
                j += 1
        # check nodes with missing edges
        elif ("return " not in tupple[2]) and ((tupple[1] == "simple" and g.out_degree(v) == 0) or (tupple[1] == "loop" and g.out_degree(v) == 1)):
            j = i+1
            # search next stmts for the ones where to link previous node
            while j < len(control):
                tupple2 = control[j]
                if tupple2[0] <= depth and (tupple2[1] == "else" or "elif" == tupple2[1]):
                    depth = tupple2[0]
                elif tupple2[0] <= depth:
                    tmp = checkBetween(prev, depth-1, tupple2[0])
                    if tmp != -1:
                        g.add_edge(tupple[2], prev[tmp])
                    else:
                        g.add_edge(tupple[2], tupple2[2])
                    break
                j += 1
            # case of not having more stmt after loop
            if j == len(control):
                tmp = checkBetween(prev, depth-1, 0)
                if tmp != -1:
                    g.add_edge(tupple[2], prev[tmp])
        i += 1
    g.layout(prog='dot')
    res = "controlgraph"+time.asctime(time.localtime(time.time()))+".png"
    g.draw(res)
    return res


# data graph function generator to show data dependecies
def dataGraph(graph, function):
    data = graph[function]
    print(data)
    cl = -1
    prev = {}
    name = " "
    g = pgv.AGraph(strict=True, directed=True)
    # k is final var and v an array with its operations (ex: a = 2 + b -> k=a, v=[2,+ #n, b]
    # or k is a conditional stmt and v an array with its paths -> 1 (true) and 0 (elif/else)
    for index, (n, k, v) in enumerate(data):
        if n == -2:
            lab = k
            while "#" in lab:
                lab = lab[:-1]
            g.add_node(k, label=lab, style="filled", fillcolor='red')
            for i in v:
                g.add_edge(i, k)
        # creates a cluster for if/elif/else/for/while stmts
        elif "if" in k or "for" in k or "while" in k or "else" in k:
            if (n,k,v) != data[-1] and n < data[index + 1][0]:
                cl += 1
                if n > 0:
                    c = prev[n-1]
                    c.add_subgraph(name="cluster_%d" % cl, label=k)
                    prev[n] = c.get_subgraph("cluster_%d" % cl)
                else:
                    g.add_subgraph(name="cluster_%d" % cl, label=k)
                    prev[n] = g.get_subgraph("cluster_%d" % cl)
                for i in v:
                    prev[n].add_node(i, label=i, style="filled")
                if not v:
                    prev[n].add_node(name, style="invis")
                    name += " "
        else:
            lab = k
            while "*" in lab:
                lab = lab[:-1]
            # var which value has changed has a green node
            if n > 0:
                prev[n-1].add_node(k, label=lab, style="filled", fillcolor='green')
            # var which value has changed has a green node
            else:
                g.add_node(k, label=lab, style="filled", fillcolor='green')
            j = 0
            # ex: var a = 2
            if len(v) == 1:
                if v[0] not in g:
                    g.add_node(v[0], label=v[0], style="filled")
                g.add_edge(v[0], k)
                j = 1
            # ex: var a = 2 + 3
            while j < len(v):
                if v[j] not in g:
                    # v[j] is a number/other variable
                    if j % 2 == 0:
                        g.add_node(v[j], label=v[j], style="filled")
                    # v[j] is a operation sign so v[j] = operation sign #number of times it apeared (ex: v[j] = "+ #2")
                    # we label the node just with the sign operation
                    else:
                        g.add_node(v[j], label=v[j][0], style="filled")

                if j != 0:
                    # v[0] conects to operation node v[1]
                    if j == 1:
                        g.add_edge(v[0], v[1])
                    # var conects to previous node wich is an operation node)
                    elif j % 2 == 0:
                        g.add_edge(v[j], v[j-1])
                        # last position of v conects to k
                        if j == len(v)-1:
                            g.add_edge(v[j-1], k)
                    # node operation conect with previous node operation that represents the final
                    # result of that operation
                    else:
                        g.add_edge(v[j-2], v[j])
                j += 1
    # list = getSubgraphList(g)
    # delete subgraphs that don't have data dependecies
    for sub in g.subgraphs():
        has_input = 0
        for node in sub:
            if g.in_degree(node) != 0:
                has_input = 1
                break
        if has_input == 0 and not sub.subgraphs():
            for node in sub.nodes():
                g.remove_node(node)
            parent = sub.subgraph_parent()
            if parent.name is None:
                g.delete_subgraph(sub.name)
            else:
                parent.delete_subgraph(sub.name)
    g.layout(prog='dot')
    res = "datagraph"+time.asctime(time.localtime(time.time()))+".png"
    g.draw(res)
    return res


def getSubgraphList(graph):
    list = []
    for g in graph.subgraphs():
        if g.subgraphs():
            list = list + getSubgraphList(g)
        list.append(g)
    return list


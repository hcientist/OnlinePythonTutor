import sys

import pygraphviz as pgv

#Call graph function generator
#blue for functions defined on user program
# green for functions of pythons libraries
def callGraph(graph):
    print(graph)
    g = pgv.AGraph(strict=True, directed=True)
    i = 0
    for function1 in graph:
        if i == 0:
            g.add_node(function1, style="filled", fillcolor='lightblue')
            i += 1
        if function1 not in g:
            if function1.endswith(')'):
                g.add_node(function1, style="filled", fillcolor='lightblue')
            else:
                g.add_node(function1, style="filled", fillcolor='greenyellow')
        for function2 in graph[function1]:
            if function2 not in g:
                if function2.endswith(')'):
                    g.add_node(function2, style="filled", fillcolor='lightblue')
                else:
                    g.add_node(function2, style="filled", fillcolor='greenyellow')
            g.add_edge(function1, function2)
    print(g)
    g.layout(prog='dot')
    g.draw('callgraph.png')
    return "callgraph.png"



def checkBetween(prev, fro, to):
    while fro >= to:
        if "for" in prev[fro] or "while" in prev[fro]:
            return fro
        fro -= 1
    return -1


def controlGraph(graph, function):
    control = graph[function]
    g = pgv.AGraph(strict=True, directed=True)
    prev = {}
    nbody = -1
    for (body, type, value) in control:
        g.add_node(value)
        if nbody == -1:
            nbody += 1
            prev[nbody] = value
        else:
            if nbody == body:
                g.add_edge(prev[nbody], value)
                prev[nbody] = value
            elif nbody < body:
                g.add_edge(prev[nbody], value)
                nbody += 1
                prev[nbody] = value
            else:
                n = nbody
                con = 0
                while nbody > body:
                    nbody -= 1
                    if con == 0 and ("for" in prev[nbody] or "while" in prev[nbody]):
                        g.add_edge(prev[n], prev[nbody])
                        con = 1
                if "else" not in prev[nbody]:
                    g.add_edge(prev[nbody], value)
                prev[nbody] = value
    prev = {}
    i = 0
    while i < len(control)-1:
        tupple = control[i]
        v = g.get_node(tupple[2])

        depth = tupple[0]
        prev[depth] = tupple[2]

        if (tupple[1] == "simple" and g.out_degree(v) == 0) or (tupple[1] == "while" and g.out_degree(v) ==1) or (tupple[1] == "for" and g.out_degree(v) ==1):
            j = i+1
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
                    j = len(control)
                j += 1
        i += 1
    g.layout(prog='dot')
    g.draw('controlgraph.png')
    return "controlgraph.png"

def dataGraph(graph, function):
    data = graph[function]
    i = 0
    cl = -1
    stmt = ""
    g = pgv.AGraph(strict=True, directed=True)
    for (k, v) in data:
        cl += 1
        if "if" in k:
            stmt = v[0]
            g.add_subgraph(name="cluster_%d" %cl, label=k)
            c = g.subgraphs()[-1]
            for n in v:
                if "#" in n:
                    c.add_node(n, label=n[0], style="filled")
                else:
                    c.add_node(n, label=n, style="filled")
        elif "else" in k:
            stmt = v
        else:
            if i == 0:
                g.add_node(k, label=k, style="filled", fillcolor='green')
            i += 1
            if k not in g:
                g.add_node(k, label=k, style="filled", fillcolor='green')
            j = 0
            if len(v) == 1:
                if v[0] not in g:
                    g.add_node(v[0], label=v[0], style="filled")
                if "*" in k:
                    g.add_edge(v[0], stmt)
                    g.add_edge(stmt, k)
                    g.get_node(k).attr['label'] = k[:-1]
                else:
                    g.add_edge(v[0], k)
                j = 1
            while j < len(v):
                if v[j] not in g:
                    if j % 2 == 0:
                        g.add_node(v[j], label=v[j], style="filled")
                    else:
                        g.add_node(v[j], label=v[j][0], style="filled")
                if j != 0:
                    if j == 1:
                        g.add_edge(v[0], v[1])
                    elif j % 2 == 0:
                        g.add_edge(v[j], v[j-1])
                        if j == len(v)-1:
                            if "*" in k:
                                g.get_node(k).attr['label'] = k[:-1]
                                g.add_edge(v[j-1], stmt)
                                g.add_edge(stmt, k)
                            else:
                                g.add_edge(v[j-1], k)
                    else:
                        g.add_edge(v[j-2], v[j])
                j += 1
    g.layout(prog='dot')
    g.draw('datagraph.png')
    return "datagraph.png"

# 0 = graph type ; 1 = graph properties ; 2 function
def main(argv):
    if argv[0] == "FCG":
        callGraph(argv[1])
    elif argv[0] == "CFG":
        controlGraph(argv[1], argv[2])
    elif argv[0] == "DFG":
        dataGraph(argv[1], argv[2])
    else:
        print("Not a valid type")


if __name__ == '__main__':
    main(sys.argv)
import sys

from igraph import *


def callGraph(graph):
    g = Graph(directed=True)
    i = 0
    for function1 in graph:
        if i == 0:
            g.add_vertex(function1)
            i += 1
            g.vs[len(g.vs)-1]["type"] = "d"
        if not g.vs.select(name=function1):
            g.add_vertex(function1)
            if function1.endswith(')'):
                g.vs[len(g.vs)-1]["type"] = "d"
            else:
                g.vs[len(g.vs)-1]["type"] = "p"
        for function2 in graph[function1]:
            if not g.vs.select(name=function2):
                g.add_vertex(function2)
                if function2.endswith(')'):
                    g.vs[len(g.vs)-1]["type"] = "d"
                else:
                    g.vs[len(g.vs)-1]["type"] = "p"
            if g.get_eid(function1, function2, error=False) == -1:
                g.add_edge(function1, function2)
    visual_style = {}
    visual_style["vertex_size"] = 20
    visual_style["vertex_label"] = g.vs["name"]
    visual_style["layout"] = g.layout("rt")
    color_dict = {"d": "light blue", "p": "light green"}
    visual_style["vertex_color"] = [color_dict[type] for type in g.vs["type"]]
    visual_style["vertex_size"] = 40
    visual_style["vertex_shape"] = "circle"
    visual_style["bbox"] = (600, 600)
    visual_style["margin"] = 20
    plot(g, **visual_style)


def checkBetween(prev, fro, to):
    while fro >= to:
        if "for" in prev[fro] or "while" in prev[fro]:
            return fro
        fro -= 1
    return -1


def controlGraph(graph, function):
    control = graph[function]
    g = Graph(directed=True)
    prev = {}
    nbody = -1
    for (body, type, value) in control:
        g.add_vertex(value)
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
        v = g.vs.select(name=tupple[2])
        depth = tupple[0]
        prev[depth] = tupple[2]
        if (tupple[1] == "simple" and g.degree(v, type="out")[0] == 0) or (tupple[1] == "while" and g.degree(v, type="out")[0]==1) or (tupple[1] == "for" and g.degree(v,type="out")[0]==1):
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
    visual_style = {}
    visual_style["vertex_size"] = 20
    visual_style["vertex_label"] = g.vs["name"]
    visual_style["layout"] = g.layout("rt")
    visual_style["vertex_color"] = "light blue"
    visual_style["vertex_size"] = 40
    visual_style["vertex_shape"] = "rectangle"
    visual_style["bbox"] = (700, 700)
    visual_style["margin"] = 20
    plot(g, **visual_style)


def dataGraph(graph, function):
    data = graph[function]
    i = 0
    stmt = ""
    g = Graph(directed=True)
    for (k, v) in data:
        if "if" in k:
            stmt = v[0]
            if i == 0:
                g.add_vertex(k)
                g.vs.select(name=k)["lab"] = k
                g.vs.select(name=k)["color"] = "red"
                i += 1
            elif not g.vs.select(name=k):
                g.add_vertex(k)
                g.vs.select(name=k)["lab"] = k
                g.vs.select(name=k)["color"] = "red"
            for n in v:
                g.add_vertex(n)
                g.vs.select(name=n)["color"] = "red"
                if "#" in n:
                    g.vs.select(name=n)["lab"] = n[0]
                else:
                    g.vs.select(name=n)["lab"] = n
                g.add_edge(k, n)
        elif "else" in k:
            stmt = v
        else:
            if i == 0:
                g.add_vertex(k)
                g.vs.select(name=k)["lab"] = k
                g.vs.select(name=k)["color"] = "green"
                i += 1
            if not g.vs.select(name=k):
                g.add_vertex(k)
                g.vs.select(name=k)["lab"] = k
                g.vs.select(name=k)["color"] = "green"
            j = 0
            if len(v) == 1:
                if not g.vs.select(name=v[0]):
                    g.add_vertex(v[0])
                    g.vs.select(name=v[0])["lab"] = v[0]
                    g.vs.select(name=v[0])["color"] = "blue"
                if "*" in k:
                    g.add_edge(v[0], stmt)
                    g.add_edge(stmt, k)
                    g.vs.select(name=k)["lab"] = k[:-1]
                else:
                    g.add_edge(v[0], k)
                j = 1
            while j < len(v):
                if not g.vs.select(name=v[j]):
                    g.add_vertex(v[j])
                    g.vs.select(name=v[j])["color"] = "blue"
                    if j % 2 == 0:
                        g.vs.select(name=v[j])["lab"] = v[j]
                    else:
                        g.vs.select(name=v[j])["lab"] = v[j][0]
                if j != 0:
                    if j == 1:
                        g.add_edge(v[0], v[1])
                    elif j % 2 == 0:
                        g.add_edge(v[j], v[j-1])
                        if j == len(v)-1:
                            if "*" in k:
                                g.vs.select(name=k)["lab"] = k[:-1]
                                g.add_edge(v[j-1], stmt)
                                g.add_edge(stmt, k)
                            else:
                                g.add_edge(v[j-1], k)
                    else:
                        g.add_edge(v[j-2], v[j])
                j += 1
    color_dict = {"blue": "light blue", "green": "light green", "red": "red"}
    visual_style = {}
    visual_style["vertex_size"] = 20
    visual_style["vertex_label"] = g.vs["lab"]
    visual_style["layout"] = g.layout("lgl")
    visual_style["vertex_color"] = [color_dict[type] for type in g.vs["color"]]
    visual_style["vertex_size"] = 40
    visual_style["vertex_shape"] = "circle"
    visual_style["bbox"] = (600, 600)
    visual_style["margin"] = 20
    print("olha o grafo ", g)


def getFCG(data):
    return callGraph(data)

def getCFG(data,function):
    return controlGraph(data, function)

def getDFG(data, function):
    return dataGraph(data, function)


import sys

from antlr4 import *
import graphGenerator
from MyVisitor import MyVisitor
from PythonLexer import PythonLexer
from PythonParser import PythonParser
import os

def testefunc(graph, code, function):
    file = open("testfile.txt", "w")
    file.write(code)
    file.close()

    input=FileStream("testfile.txt")

    if os.path.isfile("textfile.txt"):
        os.remove("testfile.txt")

    lexer = PythonLexer(input)
    stream = CommonTokenStream(lexer)
    parser = PythonParser(stream)
    tree = parser.root()
    visitor = MyVisitor()
    visitor.visit(tree)
    src = ""
    if graph == "FCG":
        src = graphGenerator.callGraph(visitor.getCall())
    elif graph == "CFG":
        src = graphGenerator.controlGraph(visitor.getControl(), function)
    elif graph == "DFG":
        src = graphGenerator.dataGraph(visitor.getData(), function)
    return src


def getFunctions(code):

    file = open("testfile.txt", "w")
    file.write(code)
    file.close()

    input=FileStream("testfile.txt")

    os.remove("testfile.txt")

    lexer = PythonLexer(input)
    stream = CommonTokenStream(lexer)
    parser = PythonParser(stream)
    tree = parser.root()
    visitor = MyVisitor()
    visitor.visit(tree)
    return visitor.getListFunctions()

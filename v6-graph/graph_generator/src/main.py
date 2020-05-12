import sys

from antlr4 import *
import graphGenerator
from MyVisitor import MyVisitor
from PythonLexer import PythonLexer
from PythonParser import PythonParser
import os

def testefunc(code):
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
   # graphGenerator.main(["FCG", visitor.getCall()])
    print(visitor.getData())
    graphGenerator.getDFG(visitor.getData(), "teste")
   # graphGenerator.main(["CFG", visitor.getControl(), "teste"])


def getFunctions(code):

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
    return visitor.getListFunctions()

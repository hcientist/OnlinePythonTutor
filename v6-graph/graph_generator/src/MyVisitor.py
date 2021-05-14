import sys

sys.path.append("../gen/")

from PythonParserVisitor import PythonParserVisitor
from PythonParser import PythonParser


class MyVisitor(PythonParserVisitor):
    def __init__(self):
        self.funDef = {}  # list of defined functions {name of function, its definition}
        self.funCall = {}  # list of functions calls by function
        self.funControl = {}  # flow of each function (key, type, value)
        self.dataFlow = {}   # name of function : [(number body, name of var, operation)]
        self.existingFun = []  # list of existing functions
        self.listVars = {}  # list of existing var and number of times it was used
        self.functiOn = ""  # function being parsed
        self.varOn = ""  # var being parsed
        self.body = {}  # body being parsed
        self.nbody = -1  # number of body being parsed
        self.elses = 0  # number of elses
        self.ifs = {}  # if in execution by body
        self.active = []  # final vars actives
        self.data = []  # operation being parsed
        self.conditional = False  # if it's in a conditional body
        self.nconditional = 0  # number of conditional body
        self.condVars = {}  # listVars of conditional bodys
        self.listCondVars = []  # list of all cond vars
        self.finalCondVars = {} # dictionary of final variables of cond bodys
        self.operations = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  # {+,-,*,/,%,&,|,^,**,//,<<,>>}  # number of each sign
        self.saveData = False  # if it's to an operation on data
        self.multiAssign = False


    def getCall(self):
        return self.uniformize()

    def getControl(self):
        return self.funControl

    def getData(self):
        return self.dataFlow

    def getListFunctions(self):
        newList= []
        for key in self.funDef:
            newList.append(key)
        return newList

    def uniformize(self):
        newDict = {}
        for key in self.funCall:
            list = []
            for function in self.funCall[key]:
                if function in self.funDef:
                    list.append(self.funDef[function])
                else:
                    list.append(function)
            newDict[self.funDef[key]] = list
        return newDict

    def visitFuncdef(self, ctx):
        name = ctx.name().getText()
        arg = ""
        if ctx.typedargslist():
            arg = ctx.typedargslist().getText()
        definition = ctx.name().getText() + ctx.OPEN_PAREN().getText() + arg + ctx.CLOSE_PAREN().getText()
        self.data = []
        for i in self.operations:
            i = 0
        self.functiOn = name
        self.nbody = -1
        self.funDef[name] = definition
        self.funControl[name] = []
        self.elses = 0
        self.existingFun = []
        self.listVars = {}
        self.dataFlow[name] = []
        self.saveData = False
        self.conditional = False
        self.nconditional = 0
        self.condVars = {}
        self.listCondVars = []
        self.finalCondVars = {}
        self.active = []
        return self.visitChildren(ctx)

    def visitAtomFun(self, ctx:PythonParser.AtomFunContext):
        name = ctx.name().getText()
        if self.saveData:
            var = ctx.getText()
            self.data.append(var)
        if self.functiOn in self.funCall:
            self.funCall[self.functiOn].append(name)
        else:
            self.funCall[self.functiOn] = [name]
        return 0

    def visitAtomArr(self, ctx:PythonParser.AtomArrContext):
        if self.saveData:
            var = ctx.getText()
            self.data.append(var)
        return 0

    def visitAtom2(self, ctx: PythonParser.Atom2Context):
        if self.saveData:
            var = ctx.getText()
            self.data.append(var)
        return 0

    def visitCompoundStmt(self, ctx:PythonParser.CompoundStmtContext):
        return self.visitChildren(ctx)

    def visitExpr_stmt(self, ctx:PythonParser.Expr_stmtContext):
        self.varOn = ctx.testlist_star_expr().getText()
        list = [self.varOn]
        equal = ctx.getText().split('=')
        if 2 < len(equal):
            list = self.multiAssign1(equal)
        elif ',' in equal[0]:
            list = self.multiAssign2(equal[0], equal[1])
        for var in list:
            if self.conditional is True:
                if var in self.condVars[self.getBody()]:
                    self.condVars[self.getBody()][var] += 1
                else:
                    self.condVars[self.getBody()][var] = 0
            else:
                if var in self.listVars:
                    self.listVars[var] += 1
                else:
                    self.listVars[var] = 0
        return self.visitChildren(ctx)

    def multiAssign1(self, list):
        for var in list[:-1]:
            self.dataFlow[self.functiOn].append((self.nbody, var, [list[-1]]))
        self.multiAssign = True
        return list[:-1]

    def multiAssign2(self, vars, values):
        vars = vars.split(',')
        if ',' in values:
            values = values.split(',')
        else:
            values = values.replace("'", "")
        for i in range(len(vars)):
            self.dataFlow[self.functiOn].append((self.nbody, vars[i], [values[i]]))
        self.multiAssign = True
        return vars

    def visitSimple_stmt(self, ctx:PythonParser.Simple_stmtContext):
        stmt = ctx.getText().rstrip()
        while stmt not in self.body[self.nbody]:
            self.nbody -= 1
        while stmt in self.existingFun:
            stmt += " "
        if self.conditional is True and self.nbody < self.nconditional:
            self.conditional = False
            self.updDataFlow()
            self.condVars = {}
        self.existingFun.append(stmt)
        self.funControl[self.functiOn].append((self.nbody, "simple", stmt))
        if "print" in stmt:
            if self.functiOn in self.funCall:
                self.funCall[self.functiOn].append("print")
            else:
                self.funCall[self.functiOn] = ["print"]
            return 0
        return self.visitChildren(ctx)

    # for some reason return and var were together (ex: returna instead of return a)
    def visitReturn_stmt(self, ctx: PythonParser.Return_stmtContext):
        end = ""
        if ctx.testlist():
            end = ctx.testlist().getText()
        self.funControl[self.functiOn][-1] = (self.nbody, "simple", "return "+end)
        return self.visitChildren(ctx)

    def visitWhile_stmt(self, ctx:PythonParser.While_stmtContext):
        while ctx.getText() not in self.body[self.nbody]:
            self.nbody -= 1
        if self.conditional is True and self.nbody < self.nconditional:
            self.conditional = False
            self.updDataFlow()
            self.condVars = {}
        stmt = "while " + ctx.test().getText()
        while stmt in self.existingFun:
            stmt += " "
        self.existingFun.append(stmt)
        self.funControl[self.functiOn].append((self.nbody, "loop", stmt))

        self.ifs[self.nbody] = stmt
        self.dataFlow[self.functiOn].append((self.nbody, stmt, []))
        return self.visitChildren(ctx)

    def visitFor_stmt(self, ctx:PythonParser.For_stmtContext):
        while ctx.getText() not in self.body[self.nbody]:
            self.nbody -= 1
        if self.conditional is True and self.nbody < self.nconditional:
            self.conditional = False
            self.updDataFlow()
            self.condVars = {}
        stmt = "for " + ctx.exprlist().getText() + " in " + ctx.testlist().getText()
        while stmt in self.existingFun:
            stmt += " "
        self.existingFun.append(stmt)
        self.funControl[self.functiOn].append((self.nbody, "loop", stmt))
        self.ifs[self.nbody] = stmt
        self.dataFlow[self.functiOn].append((self.nbody, stmt, []))
        return self.visitChildren(ctx)

    def visitIf_stmt(self, ctx:PythonParser.If_stmtContext):
        stmt = "if " + self.replace(ctx.test().getText())
        while ctx.test().getText() not in self.body[self.nbody]:
            self.nbody -= 1
        if self.conditional is False:
            self.conditional = True
            self.nconditional = self.nbody + 1
            self.condVars[self.nconditional] = self.listVars.copy()
        else:
            self.condVars[self.nbody + 1] = self.condVars[max(list(self.condVars))]
        while stmt in self.existingFun:
            stmt += " "
        self.existingFun.append(stmt)
        self.funControl[self.functiOn].append((self.nbody, "if", stmt))

        self.ifs[self.nbody] = stmt
        self.dataFlow[self.functiOn].append((self.nbody, stmt, []))
        return self.visitChildren(ctx)

    def visitElif_clause(self, ctx:PythonParser.Elif_clauseContext):
        while ctx.getText() not in self.body[self.nbody]:
            self.nbody -= 1
        stmt = "elif " + self.replace(ctx.test().getText())
        while stmt in self.existingFun:
            stmt += " "
        if len(self.condVars) == 1:
            self.condVars[self.nconditional] = self.listVars.copy()
        else:
            self.condVars[self.nbody + 1] = self.getPrevBody()
        self.existingFun.append(stmt)
        self.funControl[self.functiOn].append((self.nbody, "elif", stmt))
        self.addElse(stmt, self.ifs[self.nbody])
        self.ifs[self.nbody] = stmt
        self.dataFlow[self.functiOn].append((self.nbody, stmt, []))
        return self.visitChildren(ctx)

    def visitElse_clause(self, ctx:PythonParser.Else_clauseContext):
        while ctx.getText() not in self.body[self.nbody]:
            self.nbody -= 1
        self.funControl[self.functiOn].append((self.nbody, "else", "else #" + str(self.elses)))
        self.elses += 1
        stmt = "else #" + str(self.elses)
        if self.conditional is True and self.nbody == self.nconditional-1:
            if len(self.condVars) == 1:
                self.condVars[self.nconditional] = self.listVars.copy()
            else:
                self.condVars[self.nbody + 1] = self.getPrevBody()
        self.addElse(stmt, self.ifs[self.nbody])
        self.ifs[self.nbody] = stmt
        self.dataFlow[self.functiOn].append((self.nbody, stmt, []))
        return self.visitChildren(ctx)

    def visitSuite(self, ctx:PythonParser.SuiteContext):
        self.nbody += 1
        self.body[self.nbody] = ctx.getText()
        return self.visitChildren(ctx)

    def visitEnd(self, ctx:PythonParser.EndContext):
        if self.saveData:
            var = self.varOn
            a = 0
            body = self.getBody()
            if self.conditional is True and body > -1:
                if len(self.condVars[self.getBody()]) > 0:
                    a = self.condVars[body][self.varOn]
                for i in range(0, a):
                    var += "'"
                var += "*"
                while var in self.listCondVars:
                    var += "*"
                self.addFinal(var)
                self.listCondVars.append(var)
            elif self.varOn in self.listVars:
                a = self.listVars[self.varOn]
                for i in range(0, a):
                    var += "'"
            self.dataFlow[self.functiOn].append((self.nbody, var, self.data))
            self.data = []
        self.saveData = False
        return self.visitChildren(ctx)

    # assign operations ex: +=,-=,*=,...
    def visitAssign3(self, ctx:PythonParser.Assign3Context):
        self.saveData = True
        var = self.varOn
        tmp = self.checkActive(var)
        if tmp != "false":
            var = tmp
        elif self.conditional is True:
            for i in range(0, self.condVars[self.getBody()][self.varOn]-1):
                var += "'"
            if self.varOn not in self.listVars or self.condVars[self.getBody()][self.varOn]-1 != self.listVars[self.varOn]:
                var = self.getPrevCond(var)
        else:
            for i in range(0, self.listVars[self.varOn]-1):
                var += "'"
        self.data.append(var)
        return self.visitChildren(ctx)

    def visitAddAssign(self, ctx:PythonParser.AddAssignContext):
        self.data.append("+ #" + str(self.operations[0]))
        self.operations[0] += 1
        return self.visitChildren(ctx)

    def visitSubAssign(self, ctx:PythonParser.SubAssignContext):
        self.data.append("- #" + str(self.operations[1]))
        self.operations[1] += 1
        return self.visitChildren(ctx)

    def visitMultAssign(self, ctx:PythonParser.MultAssignContext):
        self.data.append("* #" + str(self.operations[2]))
        self.operations[2] += 1
        return self.visitChildren(ctx)

    def visitDivAssign(self, ctx:PythonParser.DivAssignContext):
        self.data.append("/ #" + str(self.operations[3]))
        self.operations[3] += 1
        return self.visitChildren(ctx)

    def visitModAssign(self, ctx:PythonParser.ModAssignContext):
        self.data.append("% #" + str(self.operations[4]))
        self.operations[4] += 1
        return self.visitChildren(ctx)

    def visitAndAssign(self, ctx:PythonParser.AndAssignContext):
        self.data.append("& #" + str(self.operations[5]))
        self.operations[5] += 1
        return self.visitChildren(ctx)

    def visitOrAssign(self, ctx:PythonParser.OrAssignContext):
        self.data.append("| #" + str(self.operations[6]))
        self.operations[6] += 1
        return self.visitChildren(ctx)

    def visitXorAssign(self, ctx:PythonParser.XorAssignContext):
        self.data.append("^ #" + str(self.operations[7]))
        self.operations[7] += 1
        return self.visitChildren(ctx)

    def visitPowerAssign(self, ctx:PythonParser.PowerAssignContext):
        self.data.append("** #" + str(self.operations[8]))
        self.operations[8] += 1
        return self.visitChildren(ctx)

    def visitIdivAssign(self, ctx:PythonParser.IdivAssignContext):
        self.data.append("// #" + str(self.operations[9]))
        self.operations[9] += 1
        return self.visitChildren(ctx)

    def visitLeftAssign(self, ctx:PythonParser.LeftAssignContext):
        self.data.append("<< #" + str(self.operations[10]))
        self.operations[10] += 1
        return self.visitChildren(ctx)

    def visitRightAssign(self, ctx:PythonParser.RightAssignContext):
        self.data.append(">> #" + str(self.operations[11]))
        self.operations[11] += 1
        return self.visitChildren(ctx)

    #####################################

    def visitAtom6(self, ctx:PythonParser.Atom6Context):
        if self.saveData:
            var = ctx.getText()
            a = 0
            tmp = self.checkActive(var)
            if tmp != "false":
                var = tmp
            elif self.conditional and var in self.condVars[self.getBody()]:
                a = self.condVars[self.getBody()][var]
                for i in range(0, a-1):
                    var += "'"
                if a != 0:
                    var = self.getPrevCond(var)
            else:
                if var in self.listVars:
                    a = self.listVars[var]
                if var == self.varOn:
                    for i in range(0, a-1):
                        var += "'"
                else:
                    for i in range(0, a):
                        var += "'"
            self.data.append(var)
        return self.visitChildren(ctx)

    def visitAtom9(self, ctx:PythonParser.Atom9Context):
        if self.saveData:
            n = ctx.getText()
            self.data.append(n)
        return self.visitChildren(ctx)

    def visitAtom11(self, ctx: PythonParser.Atom11Context):
        if self.saveData:
            n = ctx.getText()
            self.data.append(n)
        return self.visitChildren(ctx)

    def visitExpr4(self, ctx:PythonParser.Expr4Context):
        if self.nbody in self.ifs and ctx.getText() in self.ifs[self.nbody]:
            self.saveData = False
        return self.visitChildren(ctx)

    def visitAssign1(self, ctx: PythonParser.Assign1Context):
        if self.multiAssign:
            self.saveData = False
            self.multiAssign = False
        else:
            self.saveData = True
        return super().visitAssign1(ctx)

    def visitExprOp(self, ctx:PythonParser.ExprOpContext):
        if self.saveData:
            text = ctx.getText()
            op = self.wichOp(text)
            self.data.append(text + " #" + str(self.operations[op]))
            self.operations[op] += 1
        return self.visitChildren(ctx)

    def wichOp(self, s):
        switcher = {
            "+":0,
            "-":1,
            "*":2,
            "/":3,
            "%":4,
            "&":5,
            "|":6,
            "^":7,
            "**":8,
            "//":9,
            "<<":10,
            ">>":11
        }
        return switcher.get(s, -1)

    def visitArgs(self, ctx:PythonParser.ArgsContext):
        var = ctx.named_parameter().getText()
        self.listVars[var] = 0
        return self.visitChildren(ctx)

    def visitKwargs(self, ctx:PythonParser.KwargsContext):
        var = ctx.named_parameter().getText()
        self.listVars[var] = 0
        return self.visitChildren(ctx)

    def visitArg(self, ctx:PythonParser.ArgContext):
        var = ctx.named_parameter().getText()
        self.listVars[var] = 0
        return self.visitChildren(ctx)

    def getBody(self):
        for i in sorted(self.condVars.keys(), reverse=True):
            if i <= self.nbody:
                return i
        return -1

    def getPrevBody(self):
        r = 0
        for i in sorted(self.condVars.keys(), reverse=True):
            if r == 1:
                return self.condVars[i]
            if i <= self.nbody:
                r = 1
        return self.listVars.copy()

    def getPrevCond(self, var):
        final = ""
        for i in self.listCondVars:
            if var in i and "*" in i:
                final = i
        return final


    def addElse(self, s, condition):
        for (a, b, c) in self.dataFlow[self.functiOn]:
            if b == condition:
                c.append(s)

    def replace(self, s):
        s = s.replace("not", "not ")
        s = s.replace("and", " and ")
        s = s.replace("or", " or ")
        return s

    def addFinal(self, var):
        kvar = var
        key = self.ifs[self.nbody-1]
        while "*" in kvar:
            kvar = kvar[:-1]
        while "'" in kvar:
            kvar = kvar[:-1]
        if key not in self.finalCondVars:
            self.finalCondVars[key] = [(kvar, var)]
        else:
            for (a, b) in self.finalCondVars[key]:
                if a == kvar:
                    pos = self.finalCondVars[key].index((a, b))
                    self.finalCondVars[key][pos] = (kvar, var)
                    break
            else:
                self.finalCondVars[key].append((kvar,var))

    def getFinalVar(self, var):
        var += "#"
        while var in self.listCondVars:
            var += "#"
        self.active.append(var)
        return var

    def updDataFlow(self):
        list = []
        for key in self.finalCondVars:
            for (a, b) in self.finalCondVars[key]:
                if a not in list:
                    list.append(a)
        for entry in list:
            array = []
            if entry not in self.listVars:
                self.listVars[entry] = 0
            a = self.listVars[entry]
            tmp = entry
            for i in range(0, a):
                tmp += "'"
            array.append(tmp)
            for key in self.finalCondVars:
                for (a, b) in self.finalCondVars[key]:
                    if a == entry:
                        array.append(b)
                        break
            self.dataFlow[self.functiOn].append((-2, self.getFinalVar(entry), array))
        self.finalCondVars = {}

    def checkActive(self, var):
        for i in self.active:
            tmp = i
            while "#" in tmp:
                tmp = tmp[:-1]
            if tmp == var:
                r = i
                self.active.remove(i)
                return r
        return "false"

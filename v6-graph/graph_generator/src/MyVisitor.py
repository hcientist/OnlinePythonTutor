from PythonParserVisitor import PythonParserVisitor
from PythonParser import PythonParser


class MyVisitor(PythonParserVisitor):
    def __init__(self):
        self.funDef = {}  # list of defined functions {name of function, its definition}
        self.funCall = {}  # list of functions calls by function
        self.funControl = {}  # flow of each function (key, type, value)
        self.dataFlow = {}   # name of function : (name of var, operation)
        self.existingFun = []  # list of existing functions
        self.listVars = {}  # list of existing var and number of times it was used
        self.functiOn = ""  # function being parsed
        self.varOn = ""  # var being parsed
        self.body = {}  # body being parsed
        self.nbody = -1  # number of body being parsed
        self.elses = 0  # number of elses
        self.ifs = ""  # if in execution
        self.nifs = 0  # number of current if
        self.data = []  # operation being parsed
        self.assign = []  # auto-assign operations (+=,-=,etc). this is added to data in the visitend
        self.operations = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  # {+,-,*,/,%,&,|,^,**,//,<<,>>}  # number of each sign
        self.saveData = False  # if it's to an operation on data
        self.conditional = False  # if it's in a conditional body
        self.nconditional = 0  # number of conditional body
        self.condVars = {}  # listVars of conditional bodys

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
        definition = ctx.name().getText() + ctx.OPEN_PAREN().getText() + ctx.typedargslist().getText() + ctx.CLOSE_PAREN().getText()
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
        self.nifs = 0
        return self.visitChildren(ctx)

    def visitAtomFun(self, ctx:PythonParser.AtomFunContext):
        name = ctx.name().getText()
        if self.saveData:
            var = ctx.getText()
            a = 0
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
        if self.conditional is True:
            if self.varOn in self.condVars[self.getBody()]:
                self.condVars[self.getBody()][self.varOn] += 1
            else:
                self.condVars[self.getBody()][self.varOn] = 0
        else:
            if self.varOn in self.listVars:
                self.listVars[self.varOn] += 1
            else:
                self.listVars[self.varOn] = 0
        return self.visitChildren(ctx)

    def visitSimple_stmt(self, ctx:PythonParser.Simple_stmtContext):
        stmt = ctx.getText().rstrip()
        while stmt not in self.body[self.nbody]:
            self.nbody -= 1
        while stmt in self.existingFun:
            stmt += " "
        if self.conditional is True and self.nbody < self.nconditional:
            self.conditional = False
            self.condVars = {}
        self.existingFun.append(stmt)
        self.funControl[self.functiOn].append((self.nbody, "simple", stmt))
        return self.visitChildren(ctx)

    # for some reason return and var were together (ex: returna instead of return a)
    def visitReturn_stmt(self, ctx: PythonParser.Return_stmtContext):
        end = ""
        if ctx.testlist():
            end = ctx.testlist().getText()
        self.funControl[self.functiOn].append((self.nbody, "simple", "return "+end))
        return self.visitChildren(ctx)

    def visitWhile_stmt(self, ctx:PythonParser.While_stmtContext):
        while ctx.getText() not in self.body[self.nbody]:
            self.nbody -= 1
        if self.conditional is True and self.nbody < self.nconditional:
            self.conditional = False
            self.condVars = {}
        stmt = "while " + ctx.test().getText()
        while stmt in self.existingFun:
            stmt += " "
        self.existingFun.append(stmt)
        self.funControl[self.functiOn].append((self.nbody, "while", stmt))
        return self.visitChildren(ctx)

    def visitFor_stmt(self, ctx:PythonParser.For_stmtContext):
        while ctx.getText() not in self.body[self.nbody]:
            self.nbody -= 1
        if self.conditional is True and self.nbody < self.nconditional:
            self.conditional = False
            self.condVars = {}
        stmt = "for " + ctx.exprlist().getText() + " in " + ctx.testlist().getText()
        while stmt in self.existingFun:
            stmt += " "
        self.existingFun.append(stmt)
        self.funControl[self.functiOn].append((self.nbody, "for", stmt))
        return self.visitChildren(ctx)

    def visitIf_stmt(self, ctx:PythonParser.If_stmtContext):
        stmt = "if "+ctx.test().getText()
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
        self.ifs = stmt
        self.dataFlow[self.functiOn].append((stmt, ["1 #" + str(self.nifs)]))
        self.nifs += 1
        self.funControl[self.functiOn].append((self.nbody, "if", stmt))
        return self.visitChildren(ctx)

    def visitElif_clause(self, ctx:PythonParser.Elif_clauseContext):
        while ctx.getText() not in self.body[self.nbody]:
            self.nbody -= 1
        stmt = "elif " + ctx.test().getText()
        while stmt in self.existingFun:
            stmt += " "
        self.dataFlow[self.functiOn].append((stmt, ["1 #" + str(self.nifs)]))
        self.nifs += 1
        self.addElse(stmt)
        self.ifs = stmt
        if len(self.condVars) == 1:
            self.condVars[self.nconditional] = self.listVars.copy()
        else:
            self.condVars[self.nbody + 1] = self.getPrevBody()
        self.existingFun.append(stmt)
        self.funControl[self.functiOn].append((self.nbody, "elif", stmt))
        return self.visitChildren(ctx)

    def visitElse_clause(self, ctx:PythonParser.Else_clauseContext):
        while ctx.getText() not in self.body[self.nbody]:
            self.nbody -= 1
        self.funControl[self.functiOn].append((self.nbody, "else", "else #" + str(self.elses)))
        self.elses += 1
        self.addElse("0 #" + str(self.nifs-1))
        self.dataFlow[self.functiOn].append(("else #" + str(self.elses,), "0 #" + str(self.nifs-1)))
        if len(self.condVars) == 1:
            self.condVars[self.nconditional] = self.listVars.copy()
        else:
            self.condVars[self.nbody + 1] = self.getPrevBody()
        return self.visitChildren(ctx)

    def visitSuite(self, ctx:PythonParser.SuiteContext):
        self.nbody += 1
        self.body[self.nbody] = ctx.getText()
        return self.visitChildren(ctx)

    def visitEnd(self, ctx:PythonParser.EndContext):
        if self.saveData:
            var = self.varOn
            a = 0
            if self.conditional is True:
                a = self.condVars[self.getBody()][self.varOn]
                for i in range(0, a):
                    var += "'"
                var += "*"
            elif self.varOn in self.listVars:
                a = self.listVars[self.varOn]
                for i in range(0, a):
                    var += "'"
            if self.assign:
                self.data.append(self.assign[1])
                self.data.append(self.assign[0])
            self.dataFlow[self.functiOn].append((var, self.data))
            self.data = []
            self.assign = []
        self.saveData = False
        return self.visitChildren(ctx)

    # assign operations ex: +=,-=,*=,...

    def visitAssign3(self, ctx:PythonParser.Assign3Context):
        self.saveData = True
        var = self.varOn
        if self.conditional is True:
            for i in range(0, self.condVars[self.getBody()][self.varOn]-1):
                var += "'"
            if self.varOn not in self.listVars or self.condVars[self.getBody()][self.varOn]-1 != self.listVars[self.varOn]:
                var += "*"
        else:
            for i in range(0, self.listVars[self.varOn]-1):
                var += "'"
        self.assign.append(var)
        return self.visitChildren(ctx)

    def visitAddAssign(self, ctx:PythonParser.AddAssignContext):
        self.assign.append("+ #" + str(self.operations[0]))
        self.operations[0] += 1
        return self.visitChildren(ctx)

    def visitSubAssign(self, ctx:PythonParser.SubAssignContext):
        self.assign.append("- #" + str(self.operations[1]))
        self.operations[1] += 1
        return self.visitChildren(ctx)

    def visitMultAssign(self, ctx:PythonParser.MultAssignContext):
        self.assign.append("* #" + str(self.operations[2]))
        self.operations[2] += 1
        return self.visitChildren(ctx)

    def visitDivAssign(self, ctx:PythonParser.DivAssignContext):
        self.assign.append("/ #" + str(self.operations[3]))
        self.operations[3] += 1
        return self.visitChildren(ctx)

    def visitModAssign(self, ctx:PythonParser.ModAssignContext):
        self.assign.append("% #" + str(self.operations[4]))
        self.operations[4] += 1
        return self.visitChildren(ctx)

    def visitAndAssign(self, ctx:PythonParser.AndAssignContext):
        self.assign.append("& #" + str(self.operations[5]))
        self.operations[5] += 1
        return self.visitChildren(ctx)

    def visitOrAssign(self, ctx:PythonParser.OrAssignContext):
        self.assign.append("| #" + str(self.operations[6]))
        self.operations[6] += 1
        return self.visitChildren(ctx)

    def visitXorAssign(self, ctx:PythonParser.XorAssignContext):
        self.assign.append("^ #" + str(self.operations[7]))
        self.operations[7] += 1
        return self.visitChildren(ctx)

    def visitPowerAssign(self, ctx:PythonParser.PowerAssignContext):
        self.assign.append("** #" + str(self.operations[8]))
        self.operations[8] += 1
        return self.visitChildren(ctx)

    def visitIdivAssign(self, ctx:PythonParser.IdivAssignContext):
        self.assign.append("// #" + str(self.operations[9]))
        self.operations[9] += 1
        return self.visitChildren(ctx)

    def visitLeftAssign(self, ctx:PythonParser.LeftAssignContext):
        self.assign.append("<< #" + str(self.operations[10]))
        self.operations[10] += 1
        return self.visitChildren(ctx)

    def visitRightAssign(self, ctx:PythonParser.RightAssignContext):
        self.assign.append(">> #" + str(self.operations[11]))
        self.operations[11] += 1
        return self.visitChildren(ctx)

    #####################################

    def visitAtom6(self, ctx:PythonParser.Atom6Context):
        if self.saveData:
            var = ctx.getText()
            a = 0
            if self.conditional is True and var in self.condVars[self.getBody()]:
                a = self.condVars[self.getBody()][var]
            elif var in self.listVars:
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

    def visitExpr4(self, ctx:PythonParser.Expr4Context):
        self.saveData = True
        return self.visitChildren(ctx)

    def visitAssign1(self, ctx: PythonParser.Assign1Context):
        self.saveData = True
        return super().visitAssign1(ctx)

    def visitExprOp(self, ctx:PythonParser.ExprOpContext):
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
            "&":4,
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

    def addElse(self, s):
        for (a, b) in self.dataFlow[self.functiOn]:
            if a == self.ifs:
                b.append(s)

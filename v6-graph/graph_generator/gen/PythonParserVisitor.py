# Generated from /home/stifler55/Documents/Universidade/Tese/GraphGenerator/Python/src/PythonParser.g4 by ANTLR 4.8
from antlr4 import *
if __name__ is not None and "." in __name__:
    from .PythonParser import PythonParser
else:
    from PythonParser import PythonParser

# This class defines a complete generic visitor for a parse tree produced by PythonParser.

class PythonParserVisitor(ParseTreeVisitor):

    # Visit a parse tree produced by PythonParser#root.
    def visitRoot(self, ctx:PythonParser.RootContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#single_input.
    def visitSingle_input(self, ctx:PythonParser.Single_inputContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#file_input.
    def visitFile_input(self, ctx:PythonParser.File_inputContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#eval_input.
    def visitEval_input(self, ctx:PythonParser.Eval_inputContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#SimpleStmt.
    def visitSimpleStmt(self, ctx:PythonParser.SimpleStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#CompoundStmt.
    def visitCompoundStmt(self, ctx:PythonParser.CompoundStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#if_stmt.
    def visitIf_stmt(self, ctx:PythonParser.If_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#while_stmt.
    def visitWhile_stmt(self, ctx:PythonParser.While_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#for_stmt.
    def visitFor_stmt(self, ctx:PythonParser.For_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#try_stmt.
    def visitTry_stmt(self, ctx:PythonParser.Try_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#with_stmt.
    def visitWith_stmt(self, ctx:PythonParser.With_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#class_or_func_def_stmt.
    def visitClass_or_func_def_stmt(self, ctx:PythonParser.Class_or_func_def_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#suite.
    def visitSuite(self, ctx:PythonParser.SuiteContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#decorator.
    def visitDecorator(self, ctx:PythonParser.DecoratorContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#elif_clause.
    def visitElif_clause(self, ctx:PythonParser.Elif_clauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#else_clause.
    def visitElse_clause(self, ctx:PythonParser.Else_clauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#finally_clause.
    def visitFinally_clause(self, ctx:PythonParser.Finally_clauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#with_item.
    def visitWith_item(self, ctx:PythonParser.With_itemContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#except_clause.
    def visitExcept_clause(self, ctx:PythonParser.Except_clauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#classdef.
    def visitClassdef(self, ctx:PythonParser.ClassdefContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#funcdef.
    def visitFuncdef(self, ctx:PythonParser.FuncdefContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#typedargslist.
    def visitTypedargslist(self, ctx:PythonParser.TypedargslistContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#args.
    def visitArgs(self, ctx:PythonParser.ArgsContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#kwargs.
    def visitKwargs(self, ctx:PythonParser.KwargsContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#def_parameters.
    def visitDef_parameters(self, ctx:PythonParser.Def_parametersContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#Arg.
    def visitArg(self, ctx:PythonParser.ArgContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#NoArg.
    def visitNoArg(self, ctx:PythonParser.NoArgContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#named_parameter.
    def visitNamed_parameter(self, ctx:PythonParser.Named_parameterContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#simple_stmt.
    def visitSimple_stmt(self, ctx:PythonParser.Simple_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#end.
    def visitEnd(self, ctx:PythonParser.EndContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#expr_stmt.
    def visitExpr_stmt(self, ctx:PythonParser.Expr_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#print_stmt.
    def visitPrint_stmt(self, ctx:PythonParser.Print_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#del_stmt.
    def visitDel_stmt(self, ctx:PythonParser.Del_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#pass_stmt.
    def visitPass_stmt(self, ctx:PythonParser.Pass_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#break_stmt.
    def visitBreak_stmt(self, ctx:PythonParser.Break_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#continue_stmt.
    def visitContinue_stmt(self, ctx:PythonParser.Continue_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#return_stmt.
    def visitReturn_stmt(self, ctx:PythonParser.Return_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#raise_stmt.
    def visitRaise_stmt(self, ctx:PythonParser.Raise_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#yield_stmt.
    def visitYield_stmt(self, ctx:PythonParser.Yield_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#import_stmt.
    def visitImport_stmt(self, ctx:PythonParser.Import_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#from_stmt.
    def visitFrom_stmt(self, ctx:PythonParser.From_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#global_stmt.
    def visitGlobal_stmt(self, ctx:PythonParser.Global_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#exec_stmt.
    def visitExec_stmt(self, ctx:PythonParser.Exec_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#assert_stmt.
    def visitAssert_stmt(self, ctx:PythonParser.Assert_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#nonlocal_stmt.
    def visitNonlocal_stmt(self, ctx:PythonParser.Nonlocal_stmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#testlist_star_expr.
    def visitTestlist_star_expr(self, ctx:PythonParser.Testlist_star_exprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#star_expr.
    def visitStar_expr(self, ctx:PythonParser.Star_exprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#Assign1.
    def visitAssign1(self, ctx:PythonParser.Assign1Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#Assign2.
    def visitAssign2(self, ctx:PythonParser.Assign2Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#Assign3.
    def visitAssign3(self, ctx:PythonParser.Assign3Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#AddAssign.
    def visitAddAssign(self, ctx:PythonParser.AddAssignContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#SubAssign.
    def visitSubAssign(self, ctx:PythonParser.SubAssignContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#MultAssign.
    def visitMultAssign(self, ctx:PythonParser.MultAssignContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#DivAssign.
    def visitDivAssign(self, ctx:PythonParser.DivAssignContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#ModAssign.
    def visitModAssign(self, ctx:PythonParser.ModAssignContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#AndAssign.
    def visitAndAssign(self, ctx:PythonParser.AndAssignContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#OrAssign.
    def visitOrAssign(self, ctx:PythonParser.OrAssignContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#XorAssign.
    def visitXorAssign(self, ctx:PythonParser.XorAssignContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#LeftAssign.
    def visitLeftAssign(self, ctx:PythonParser.LeftAssignContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#RightAssign.
    def visitRightAssign(self, ctx:PythonParser.RightAssignContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#PowerAssign.
    def visitPowerAssign(self, ctx:PythonParser.PowerAssignContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#IdivAssign.
    def visitIdivAssign(self, ctx:PythonParser.IdivAssignContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#AtAssign.
    def visitAtAssign(self, ctx:PythonParser.AtAssignContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#exprlist.
    def visitExprlist(self, ctx:PythonParser.ExprlistContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#import_as_names.
    def visitImport_as_names(self, ctx:PythonParser.Import_as_namesContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#import_as_name.
    def visitImport_as_name(self, ctx:PythonParser.Import_as_nameContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#dotted_as_names.
    def visitDotted_as_names(self, ctx:PythonParser.Dotted_as_namesContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#dotted_as_name.
    def visitDotted_as_name(self, ctx:PythonParser.Dotted_as_nameContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#test.
    def visitTest(self, ctx:PythonParser.TestContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#varargslist.
    def visitVarargslist(self, ctx:PythonParser.VarargslistContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#vardef_parameters.
    def visitVardef_parameters(self, ctx:PythonParser.Vardef_parametersContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#vardef_parameter.
    def visitVardef_parameter(self, ctx:PythonParser.Vardef_parameterContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#varargs.
    def visitVarargs(self, ctx:PythonParser.VarargsContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#varkwargs.
    def visitVarkwargs(self, ctx:PythonParser.VarkwargsContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#logical_test.
    def visitLogical_test(self, ctx:PythonParser.Logical_testContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#comparison.
    def visitComparison(self, ctx:PythonParser.ComparisonContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#expr5.
    def visitExpr5(self, ctx:PythonParser.Expr5Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#expr4.
    def visitExpr4(self, ctx:PythonParser.Expr4Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#expr3.
    def visitExpr3(self, ctx:PythonParser.Expr3Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#expr2.
    def visitExpr2(self, ctx:PythonParser.Expr2Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#expr1.
    def visitExpr1(self, ctx:PythonParser.Expr1Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#exprOp.
    def visitExprOp(self, ctx:PythonParser.ExprOpContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#Atom1.
    def visitAtom1(self, ctx:PythonParser.Atom1Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#Atom2.
    def visitAtom2(self, ctx:PythonParser.Atom2Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#Atom3.
    def visitAtom3(self, ctx:PythonParser.Atom3Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#Atom4.
    def visitAtom4(self, ctx:PythonParser.Atom4Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#Atom5.
    def visitAtom5(self, ctx:PythonParser.Atom5Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#AtomFun.
    def visitAtomFun(self, ctx:PythonParser.AtomFunContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#AtomArr.
    def visitAtomArr(self, ctx:PythonParser.AtomArrContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#Atom6.
    def visitAtom6(self, ctx:PythonParser.Atom6Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#Atom7.
    def visitAtom7(self, ctx:PythonParser.Atom7Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#Atom8.
    def visitAtom8(self, ctx:PythonParser.Atom8Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#Atom9.
    def visitAtom9(self, ctx:PythonParser.Atom9Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#Atom10.
    def visitAtom10(self, ctx:PythonParser.Atom10Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#Atom11.
    def visitAtom11(self, ctx:PythonParser.Atom11Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#dictorsetmaker.
    def visitDictorsetmaker(self, ctx:PythonParser.DictorsetmakerContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#testlist_comp.
    def visitTestlist_comp(self, ctx:PythonParser.Testlist_compContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#testlist.
    def visitTestlist(self, ctx:PythonParser.TestlistContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#dotted_name.
    def visitDotted_name(self, ctx:PythonParser.Dotted_nameContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#name.
    def visitName(self, ctx:PythonParser.NameContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#number.
    def visitNumber(self, ctx:PythonParser.NumberContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#integer.
    def visitInteger(self, ctx:PythonParser.IntegerContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#yield_expr.
    def visitYield_expr(self, ctx:PythonParser.Yield_exprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#yield_arg.
    def visitYield_arg(self, ctx:PythonParser.Yield_argContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#trailer.
    def visitTrailer(self, ctx:PythonParser.TrailerContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#arguments.
    def visitArguments(self, ctx:PythonParser.ArgumentsContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#arglist.
    def visitArglist(self, ctx:PythonParser.ArglistContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#argument.
    def visitArgument(self, ctx:PythonParser.ArgumentContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#subscriptlist.
    def visitSubscriptlist(self, ctx:PythonParser.SubscriptlistContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#subscript.
    def visitSubscript(self, ctx:PythonParser.SubscriptContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#sliceop.
    def visitSliceop(self, ctx:PythonParser.SliceopContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#comp_for.
    def visitComp_for(self, ctx:PythonParser.Comp_forContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by PythonParser#comp_iter.
    def visitComp_iter(self, ctx:PythonParser.Comp_iterContext):
        return self.visitChildren(ctx)



del PythonParser
/*
Python grammar.
The MIT License (MIT).
Copyright (c) 2014, Bart Kiers, bart@big-o.nl
Copyright (c) 2019, Dmitriy Litovchenko, Dmitry.Litovchenko1@yandex.ru, Positive Technologies
Copyright (c) 2019, Nikita Subbotin, sub.nik.and@gmail.com, Positive Technologies
Copyright (c) 2019, Ivan Kochurkin, kvanttt@gmail.com, Positive Technologies

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

parser grammar PythonParser;

options { tokenVocab=PythonLexer;}

root
    : (single_input
    | file_input
    | eval_input)? EOF
    ;

// A single interactive statement;
single_input
    : NEWLINE
    | simple_stmt
    | compound_stmt NEWLINE
    ;

// A module or sequence of commands read from an input file
file_input
    : (NEWLINE | stmt)+
    ;

// An input for the eval() and input() functions
eval_input
    : testlist NEWLINE*
    ;

stmt
    : simple_stmt       #SimpleStmt
    | compound_stmt     #CompoundStmt
    ;

compound_stmt
    : IF cond=test COLON suite elif_clause* else_clause?                             #if_stmt
    | WHILE test COLON suite else_clause?                                            #while_stmt
    | ASYNC? FOR exprlist IN testlist COLON suite else_clause?                       #for_stmt
    | TRY COLON suite (except_clause+ else_clause? finally_clause? | finally_clause) #try_stmt
    | ASYNC? WITH with_item (COMMA with_item)* COLON suite                           #with_stmt
    | decorator* (classdef | funcdef)                                                #class_or_func_def_stmt
    ;

suite
    : simple_stmt
    | NEWLINE INDENT stmt+ DEDENT
    ;

decorator
    : AT dotted_name (OPEN_PAREN arglist? CLOSE_PAREN)? NEWLINE
    ;

elif_clause
    : ELIF test COLON suite
    ;

else_clause
    : ELSE COLON suite
    ;

finally_clause
    : FINALLY COLON suite
    ;

with_item
    // NB compile.c makes sure that the default except clause is last
    : test (AS expr)?
    ;

// Python 2 : EXCEPT test COMMA name
// Python 3 : EXCEPT test AS name
except_clause
    : EXCEPT (test ( COMMA name | AS name )?)? COLON suite
    ;

classdef
    : CLASS name (OPEN_PAREN arglist? CLOSE_PAREN)? COLON suite
    ;

funcdef
    : ASYNC? DEF name OPEN_PAREN typedargslist? CLOSE_PAREN (ARROW test)? COLON suite
    ;

// python 3 paramters
// parameters list may have a trailing comma
typedargslist
    : (def_parameters COMMA)? (args (COMMA def_parameters)? (COMMA kwargs)? | kwargs) COMMA?
    | def_parameters COMMA?
    ;

args
    : STAR named_parameter
    ;

kwargs
    : POWER named_parameter
    ;

def_parameters
    : def_parameter (COMMA def_parameter)*
    ;

// TODO: bare STAR parameter must follow named ones
def_parameter
    : named_parameter (ASSIGN test)?  #Arg
    | STAR                            #NoArg
    ;

named_parameter
    : name (COLON test)?
    ;

simple_stmt
    : small_stmt (SEMI_COLON? small_stmt)* SEMI_COLON? end
    ;

end
    :(EOF | NEWLINE)
    ;

// TODO 1: left part augmented assignment should be `test` only, no stars or lists
// TODO 2: semantically annotated declaration is not an assignment
small_stmt
    : testlist_star_expr assign_part?                                                 #expr_stmt
    | PRINT ((test (COMMA test)* COMMA?) | RIGHT_SHIFT test ((COMMA test)+ COMMA?))   #print_stmt   // Python 2
    | DEL exprlist                                                                    #del_stmt
    | PASS                                                                            #pass_stmt
    | BREAK                                                                           #break_stmt
    | CONTINUE                                                                        #continue_stmt
    | RETURN testlist?                                                                #return_stmt
    | RAISE (test (COMMA test (COMMA test)?)?)? (FROM test)?                          #raise_stmt
    | yield_expr                                                                      #yield_stmt
    | IMPORT dotted_as_names                                                          #import_stmt
    | FROM ((DOT | ELLIPSIS)* dotted_name | (DOT | ELLIPSIS)+)
      IMPORT (STAR | OPEN_PAREN import_as_names CLOSE_PAREN | import_as_names)        #from_stmt
    | GLOBAL name (COMMA name)*                                                       #global_stmt
    | EXEC expr (IN test (COMMA test)?)?                                              #exec_stmt     // Python 2
    | ASSERT test (COMMA test)?                                                       #assert_stmt
    | NONLOCAL name (COMMA name)*                                                     #nonlocal_stmt // Python 3
    ;

testlist_star_expr
    : ((test | star_expr) COMMA)+ (test | star_expr)?
    | testlist
    ;

star_expr
    : STAR expr
    ;

assign_part
    // if left expression in assign is bool literal, it's mean that is Python 2 here
    : ASSIGN ( testlist_star_expr (ASSIGN testlist_star_expr)* (ASSIGN yield_expr)?
             | yield_expr)              #Assign1
    | COLON test (ASSIGN testlist)?     #Assign2 // annassign Python3 rule
    | assignop (yield_expr | testlist)  #Assign3
    ;

assignop
    : ADD_ASSIGN            #AddAssign
    | SUB_ASSIGN            #SubAssign
    | MULT_ASSIGN           #MultAssign
    | DIV_ASSIGN            #DivAssign
    | MOD_ASSIGN            #ModAssign
    | AND_ASSIGN            #AndAssign
    | OR_ASSIGN             #OrAssign
    | XOR_ASSIGN            #XorAssign
    | LEFT_SHIFT_ASSIGN     #LeftAssign
    | RIGHT_SHIFT_ASSIGN    #RightAssign
    | POWER_ASSIGN          #PowerAssign
    | IDIV_ASSIGN           #IdivAssign
    | AT_ASSIGN             #AtAssign
    ;

exprlist
    : expr (COMMA expr)* COMMA?
    ;

import_as_names
    : import_as_name (COMMA import_as_name)* COMMA?
    ;

// TODO: that means we can use keyword True as the name here: `from foo import bar as True` -- no
import_as_name
    : name (AS name)?
    ;

dotted_as_names
    : dotted_as_name (COMMA dotted_as_name)*
    ;

dotted_as_name
    : dotted_name (AS name)?
    ;

/*
 * Warning!
 * According to https://docs.python.org/3/reference/expressions.html#lambda LAMBDA should be followed by
 * `parameter_list` (in our case it is `typedargslist`)
 * But that's not true! `typedargslist` may have parameters with type hinting, but that's not permitted in lambda
 * definition
 */
// https://docs.python.org/3/reference/expressions.html#operator-precedence
test
    : logical_test (IF logical_test ELSE test)?
    | LAMBDA varargslist? COLON test
    ;

// the same as `typedargslist`, but with no types
varargslist
    : (vardef_parameters COMMA)? (varargs (COMMA vardef_parameters)? (COMMA varkwargs)? | varkwargs) COMMA?
    | vardef_parameters COMMA?
    ;

vardef_parameters
    : vardef_parameter (COMMA vardef_parameter)*
    ;

// TODO: bare STAR parameter must follow named ones
vardef_parameter
    : name (ASSIGN test)?
    | STAR
    ;

varargs
    : STAR name
    ;

varkwargs
    : POWER name
    ;

logical_test
    : comparison
    | NOT logical_test
    | logical_test op=AND logical_test
    | logical_test op=OR logical_test
    ;

comparison
    : comparison (LESS_THAN | GREATER_THAN | EQUALS | GT_EQ | LT_EQ | NOT_EQ_1 | NOT_EQ_2 | optional=NOT? IN | IS optional=NOT?) comparison
    | expr
    ;

expr
    : AWAIT? atom trailer*                          #expr1
    | <assoc=right> expr op=POWER expr              #expr2
    | op=(ADD | MINUS | NOT_OP) expr                #expr3
    | expr exprOp expr                              #expr4
    | expr op=AT expr                               #expr5
    ;

exprOp
    : STAR
    | DIV
    | MOD
    | IDIV
    | ADD
    | MINUS
    | LEFT_SHIFT
    | RIGHT_SHIFT
    | AND_OP
    | XOR
    | OR_OP
    ;

atom
    : OPEN_PAREN (yield_expr | testlist_comp)? CLOSE_PAREN               #Atom1
    | OPEN_BRACKET testlist_comp? CLOSE_BRACKET                          #Atom2
    | OPEN_BRACE dictorsetmaker? CLOSE_BRACE                             #Atom3
    | REVERSE_QUOTE testlist COMMA? REVERSE_QUOTE                        #Atom4
    | ELLIPSIS                                                           #Atom5
    | name OPEN_PAREN arglist? CLOSE_PAREN                               #AtomFun
    | name OPEN_BRACKET arglist CLOSE_BRACKET                           #AtomArr
    | name                                                               #Atom6
    | PRINT                                                              #Atom7
    | EXEC                                                               #Atom8
    | MINUS? number                                                      #Atom9
    | NONE                                                               #Atom10
    | STRING+                                                            #Atom11
    ;

dictorsetmaker
    : (test COLON test | POWER expr) (COMMA (test COLON test | POWER expr))* COMMA? // key_datum_list
    | test COLON test comp_for                                                      // dict_comprehension
    | testlist_comp
    ;

testlist_comp
    : (test | star_expr) (comp_for | (COMMA (test | star_expr))* COMMA?)
    ;

testlist
    : test (COMMA test)* COMMA?
    ;

dotted_name
    : dotted_name DOT name
    | name
    ;

name
    : NAME
    | TRUE
    | FALSE
    ;

number
    : integer
    | IMAG_NUMBER
    | FLOAT_NUMBER
    ;

integer
    : DECIMAL_INTEGER
    | OCT_INTEGER
    | HEX_INTEGER
    | BIN_INTEGER
    ;

yield_expr
    : YIELD yield_arg?
    ;

yield_arg
    : FROM test
    | testlist
    ;

// TODO: this way we can pass: `f(x for x in i, a)`, but it's invalid.
// See: https://docs.python.org/3/reference/expressions.html#calls
trailer
    : DOT name arguments?
    | arguments
    ;

arguments
    : OPEN_PAREN arglist? CLOSE_PAREN
    | OPEN_BRACKET subscriptlist CLOSE_BRACKET
    ;

arglist
    // The reason that keywords are test nodes instead of name is that using name
    // results in an ambiguity. ast.c makes sure it's a name.
    : argument (COMMA argument)* COMMA?
    ;

argument
    : test (comp_for | ASSIGN test)?
    | (POWER | STAR) test
    ;

// TODO: maybe inline?
subscriptlist
    : subscript (COMMA subscript)* COMMA?
    ;

subscript
    : ELLIPSIS
    | test (COLON test? sliceop?)?
    | COLON test? sliceop?
    ;

// TODO: maybe inline?
sliceop
    : COLON test?
    ;

comp_for
    : FOR exprlist IN logical_test comp_iter?
    ;

comp_iter
    : comp_for
    | IF test comp_iter?
    ;

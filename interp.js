// ctx: Context {
//   localsStack: Array of dictionaries with the local variables
//   globals: global variabels (and functions)
//   }
//
// values:
//      Object {
//          t: "obj val",
//          val: dictonary with the propertie values
//          // Members: hasOwnProperty
//      }
//      Array {
//          t: "array val",
//          val: array with values
//          // Members: length, [], push, pop
//      }
//      String {
//          t: "str val",
//          val: string value
//          // Members: length, [], charCodeAt
//      }
//      Number {
//          t: "num val",
//          val: number value
//      }
//      Bool {
//          t: "bool val",
//          val: boolean value
//      }
//      Function {
//          t: "func val",
//          val: { ast:
//              /* ctx: eventuell furture context */
//          }
//      }
//      BuildInFunction {
//          t: "buildin func val",
//          func: function(this, args) {}
//      }
//
// TODO: implement javascript library:
//      String.fromCharCode(number)
//      console.log(string)

'use strict';

function iError(msg) {
    return {
        t: "error",
        msg: msg
    };
}

var iUndefVal = {
            t: "undef val"
        };

var iNullVal = {
            t: "null val"
        };

function iGetNameVal(ctx, name) {
    if (ctx.localsStack.length > 0) {
        var locals = ctx.localsStack[ctx.localsStack.length - 1];
        if (locals.hasOwnProperty(name)) {
            return locals[name];
        }
    }
    if (ctx.globals.hasOwnProperty(name)) {
        return ctx.globals[name];
    } else {
        return iUndefVal;
    }
}

function iCopyVal(val) {
    return {
        t: val.t,
        val: val.val
    };
}

function iSetNameVal(ctx, name, val) {
    var locals = ctx.localsStack[ctx.localsStack.length - 1];
    if (locals.hasOwnProperty(name)) {
        locals[name] = iCopyVal(val);
    } else if (ctx.globals.hasOwnProperty(name)) {
        ctx.globals[name] = iCopyVal(val);
    } else {
        locals[name] = iCopyVal(val);
    }
}

function iEvalBinOp(ctx, expr) {
    var cur = iCopyVal(iEvalExpr(ctx, expr.operants[0]));
    var i = 1;
    while (i < expr.operants.length) {
        var op = expr.operators[i - 1];
        var rhs = expr.operants[i];
        if (["*","/","%","+","-","<",">",">=","<="].indexOf(op) >= 0) {
            rhs = iEvalExpr(ctx, rhs);
            if (cur.t === "str val" && cur.t === rhs.t) {
                if (false) {
                } else if (op === "+") {
                    cur.val = cur.val + rhs.val;
                } else if (op === "<=") {
                    cur.val = cur.val <= rhs.val;
                } else if (op === ">=") {
                    cur.t = "bool val";
                    cur.val = cur.val >= rhs.val;
                } else if (op === "<") {
                    cur.t = "bool val";
                    cur.val = cur.val < rhs.val;
                } else if (op === ">") {
                    cur.t = "bool val";
                    cur.val = cur.val > rhs.val;
                } else {
                    return iError("can only use + <= >= < > operator on strings");
                }
            } else if (cur.t === "num val" && cur.t === rhs.t) {
                if (false) {
                } else if (op === "*") {
                    cur.val = cur.val * rhs.val;
                } else if (op === "/") {
                    cur.val = cur.val / rhs.val;
                } else if (op === "%") {
                    cur.val = cur.val % rhs.val;
                } else if (op === "+") {
                    cur.val = cur.val + rhs.val;
                } else if (op === "-") {
                    cur.val = cur.val - rhs.val;
                } else if (op === "<=") {
                    cur.t = "bool val";
                    cur.val = cur.val <= rhs.val;
                } else if (op === ">=") {
                    cur.t = "bool val";
                    cur.val = cur.val >= rhs.val;
                } else if (op === "<") {
                    cur.t = "bool val";
                    cur.val = cur.val < rhs.val;
                } else if (op === ">") {
                    cur.t = "bool val";
                    cur.val = cur.val > rhs.val;
                }
            } else {
                return iError("can use * / % + - < > <= >= ops only with num values and + <= >= < >  with strings");
            }
        } else if (op === "===") {
            var rhs = iEvalExpr(ctx, rhs);
            cur.t = "bool val";
            cur.val = cur.t === cur.t && cur.val === rhs.val;
        } else if (op === "!==") {
            var rhs = iEvalExpr(ctx, rhs);
            cur.t = "bool val";
            cur.val = cur.t !== cur.t || cur.val !== rhs.val;
        } else if (op === "&&") {
            if (cur.t === "bool val") {
                if (cur.val) {
                    var rhs = iEvalExpr(ctx, rhs);
                    if (rhs.t === "bool val") {
                        cur.val = rhs.val;
                    } else {
                        return iError("can only use && with bool values");
                    }
                } else {
                    cur.val = false;
                }
            } else {
                return iError("can only use && with bool values");
            }
        } else if (op === "||") {
            if (cur.t === "bool val") {
                if (cur.val) {
                    cur.val = true;
                } else {
                    var rhs = iEvalExpr(ctx, rhs);
                    if (rhs.t === "bool val") {
                        cur.val = rhs.val;
                    } else {
                        return iError("can only use || with bool values");
                    }
                }
            } else {
                return iError("can only use || with bool values");
            }
        } else {
            return iError("cannot do binary op");
        }
        i = i + 1;
    }
    return cur;
}

function iEvalBlock(ctx, block) {
    var i = 0;
    while (i < block.length) {
        var stmt = block[i];
        if (stmt.t === "return stmt") {
            return {
                t: "return return",
                retval: iEvalExpr(ctx, stmt.expr)
            };
        }
        if (stmt.t === "break stmt") {
            return {
                t: "break return"
            };
        }
        if (stmt.t === "continue stmt") {
            return {
                t: "continue return"
            };
        }
        var ret = iEvalStmt(ctx, stmt);
        if (ret.t !== "normal return") {
            return ret;
        }
        i = i + 1;
    }
    return {
        t: "normal return"
    };
}

function iEvalFuncCall(ctx, thisobj, func, params) {
    if (func.t !== "func val") {
        return iError("can only call a function value");
    }
    var oldThis = ctx.thisval;
    ctx.thisval = thisobj;
    var locals = {};
    ctx.localsStack.push(locals);

    if (func.val.t === "ast func") {
        var ast = func.val.ast;

        if (ast.params.length !== params.length) {
            iError("incorrect number of arguments supplied");
        }
        var i = 0;
        while (i < ast.params.length && i < params.length) {
            locals[ast.params[i]] = iCopyVal(params[i]);
            i = i + 1;
        }

        var ret = iEvalBlock(ctx, ast.block);
        ctx.thisval = oldThis;
        ctx.localsStack.pop();
        if (ret.t !== "return return" && ret.t !== "normal return") {
            return iError("cannot break, continue in function outside loop");
        }
        if (ret.t === "return return") {
            return ret.retval;
        } else {
            return iUndefVal;
        }
    } else if (func.val.t === "buildin func") {
        return func.val.func(ctx, thiobj, func, params);
    }
}

function iBuildInStrCharCodeAt(str, args) {
    var r = str.val.charCodeAt(args[0].val);
    return {
        t: "num val",
        val: r
    };
}
function iBuildInArrayPop(array, args) {
    return array.val.pop();
}
function iBuildInArrayPush(array, args) {
    var r = array.val.push(args[0]);
    return {
        t: "num val",
        val: r
    };
}

function iBuildInObjHasOwnProperty(obj, args) {
    var r = obj.val.hasOwnProperty(args[0].val);
    return {
        t: "bool val",
        val: r
    };
}

function iMakeBuildInFunc(func) {
    return {
        t: "buildin func val",
        func: func
    };
}

function iMakeBuildInProp(func) {
    return {
        t: "buildin property",
        func: func
    };
}

function iBuildInLength(obj) {
    return {
        t: "num val",
        val: obj.val.length
    };
}

var iExpr2BuildIns = {
    "obj val": {
        "hasOwnProperty": iMakeBuildInFunc(iBuildInObjHasOwnProperty)
    },
    "array val": {
        "push": iMakeBuildInFunc(iBuildInArrayPush),
        "pop" : iMakeBuildInFunc(iBuildInArrayPush),
        "length": iMakeBuildInProp(iBuildInLength)
    },
    "str val": {
        "length": iMakeBuildInProp(iBuildInLength),
        "charCodeAt": iMakeBuildInFunc(iBuildInStrCharCodeAt)
    },
    "num val": { },
    "bool val": { },
    "func val": { },
    "buildin func val": { },
    "undef val": { },
    "null val": { }
};

function iEvalExpr2Impl(ctx, expr2, until) {
    var thisval = iUndefVal;
    var cur = iEvalExpr(ctx, expr2.innermost);
    var i = 0;
    while (i < until) {
        var a = expr2.rest[i];
        if (a.t === "dotted") {
            thisval = cur;
            if (cur.t === "obj val" && cur.val.hasOwnProperty(a.dotName)) {
                cur = cur.val[a.dotName];
            } else if ((cur.t === "obj val" && a.dotName === "hasOwnProperty") // cannto use the other case here
                    || iExpr2BuildIns[cur.t].hasOwnProperty(a.dotName)) {
                var buildin = iExpr2BuildIns[cur.t][a.dotName];
                if (buildin.t === "buildin property") {
                    cur = buildin.func(cur);
                } else {
                    cur = buildin;
                }
            } else {
                return iError("cannot dot into value");
            }
        } else if (a.t === "array index") {
            thisval = cur;
            var ie = iEvalExpr(ctx, a.indexExpr);
            if (cur.t === "obj val" && ie.t === "str val") {
                cur = cur.val[ie.val];
            } else if (ie.t === "num val" && ie.val >= 0 && cur.t === "array val") {
                cur = cur.val[ie.val];
            } else if (ie.t === "num val" && ie.val >= 0 && cur.t === "str val") {
                cur = {
                    t: "str val",
                    val: cur.val[ie.val]
                };
            } else {
                return iError("can only index in arrays/strings with integer or with string in objects");
            }
        } else if (a.t === "func call") {
            var params = [];
            var i = 0;
            while (i < a.funcParams.length) {
                params.push(iEvalExpr(ctx, a.funcParams[i]));
                i = i + 1;
            }
            if (cur.t === "func val") {
                cur = iEvalFuncCall(ctx, thisval, cur, params);
            } else if (cur.t === "buildin func val") {
                cur = cur.func(thisval, params);
            } else {
                return iError("cannot call non function");
            }
        }
        i = i + 1;
    }
    return cur;
}

function iEvalExpr2(ctx, expr2) {
    return iEvalExpr2Impl(ctx, expr2, expr2.rest.length);
}

function iEvalExpr2Set(ctx, expr2, value) {
    if (expr2.rest.length < 1) { return iError("cannot assign to expression"); }
    var last = expr2.rest.length;

    var cur = iEvalExpr2Impl(ctx, expr2, last - 1);

    var a = expr2.rest[last - 1];
    if (a.t === "dotted") {
        if (cur.t === "obj val") {
            cur.val[a.dotName] = value;
        }
    } else if (a.t === "array index") {
        thisval = iUndefVal;
        var ie = iEvalExpr(ctx, a.indexExpr);
        if (cur.t === "obj val" && ie.t === "str val") {
            cur.val[a.dotName] = value;
        } else if (ie.t === "num val" && ie.val >= 0
                && cur.t === "array val") {
            cur.val[ie.val] = value;
        } else {
            return iError("array index assignment error");
        }
    } else if (a.t === "func call") {
        return iError("func call assignment error");
    }
}

function iEvalExpr(ctx, expr) {
    if (expr.t === "id") {
        return iGetNameVal(ctx, expr.idName);
    } else if (expr.t === "this expr") {
        return ctx.thisval;
    } else if (expr.t === "null expr") {
        return iNullVal;
    } else if (expr.t === "undef expr") {
        return iUndefVal;
    } else if (expr.t === "bin op expr") {
        return iEvalBinOp(ctx, expr);
    } else if (expr.t === "expr2") {
        return iEvalExpr2(ctx, expr);
    } else if (expr.t === "obj lit") {
        var res = {};
        var i = 0;
        while (i < expr.val.length) {
            var entry = expr.val[i];
            res[entry.idx] = iEvalExpr(ctx, entry.expr);
            i = i + 1;
        }
        return {
            t: "obj val",
            val: res
        };
    } else if (expr.t === "array lit") {
        var res = [];
        var i = 0;
        while (i < expr.val.length) {
            res.push(iEvalExpr(ctx, expr.val[i]));
            i = i + 1;
        }
        return {
            t: "array val",
            val: res
        };
    } else if (expr.t === "str lit") {
        return {
            t: "str val",
            val: expr.val
        };
    } else if (expr.t === "num lit") {
        return {
            t: "num val",
            val: expr.val
        };
    } else if (expr.t === "bool lit") {
        return {
            t: "bool val",
            val: expr.val
        };
    } else {
        return iError("error in iEvalExpr");
    }
}

function iEvalStmt(ctx, stmt) {
    if (stmt.t === "return stmt") {
        // should never land here
    } else if (stmt.t === "expr stmt") {
        iEvalExpr(ctx, stmt.expr);
    } else if (stmt.t === "assign stmt") {
        // TODO disallow creating new var
        if (stmt.left.t === "id") {
            iSetNameVal(ctx, stmt.left.idName, iEvalExpr(ctx, stmt.expr));
        } else if (stmt.left.t === "expr2") {
            iEvalExpr2Set(ctx, stmt.left, iEvalExpr(ctx, stmt.expr));
        }
    } else if (stmt.t === "var decl stmt") {
        iSetNameVal(ctx, stmt.varId, iEvalExpr(ctx, stmt.expr));
    } else if (stmt.t === "if stmt") {
        var cond = iEvalExpr(ctx, stmt.cond);
        if (cond.t === "bool val" && cond.val) {
            return iEvalBlock(ctx, stmt.block);
        }
        var i = 0;
        while (i < stmt.elseifBranches.length) {
            var b = stmt.elseifBranches[i];
            var cond = iEvalExpr(ctx, b.cond);
            if (cond.t === "bool val" && cond.val) {
                return iEvalBlock(ctx, b.block);
            }
            i = i + 1;
        }
        if (stmt.elseBlock !== null) {
            return iEvalBlock(ctx, stmt.elseBlock);
        }
    } else if (stmt.t === "while stmt") {
        var cond = iEvalExpr(ctx, stmt.cond);
        while (cond.t === "bool val" && cond.val) {
            var ret = iEvalBlock(ctx, stmt.block);
            if (ret.t === "break return") {
                break;
            }
            if (ret.t === "return return") {
                return ret;
            }
            cond = iEvalExpr(ctx, stmt.cond);
        }
    } else {
        return iError("unknown statement");
    }
    return {
        t: "normal return"
    };
}

function iBuildInStrObjfromCharCode(obj, args) {
    return {
        t: "str val",
        val: String.fromCharCode(args[0].val)
    };
}

function iCreateCtx() {
    var StrObj = {
        t: "obj val",
        val: {
            fromCharCode: {
                t: "buildin func val",
                func: iBuildInStrObjfromCharCode
            }
        }
    };
    var ctx = {
        localsStack: [],
        globals: { String: StrObj },
        thisval: iUndefVal
    };
    return ctx;
}

function iEvalSrc(ctx, src) {
    var i = 0;
    while (i < src.length) {
        var item = src[i];
        if (item.t === "func decl") {
            ctx.globals[item.funcName] = {
                t: "func val",
                val: {
                    t: "ast func",
                    ast: item
                }
            };
        } else if (item.t === "var decl stmt") {
            ctx.globals[item.varId] = iEvalExpr(ctx, item.expr);
        }
        i = i + 1;
    }
}

function iEntryPoint(ctx, funcName, args) {
    if (not(ctx.globals.hasOwnProperty(funcName))) {
        return iError("couldn't find function with name '" + funcName + "'");
    }
    return iEvalFuncCall(ctx, iUndefVal, ctx.globals[funcName], args);
}

function iEval(ctx, exprStr) {
    var e = pParse(pExpr,exprStr);
    return iEvalExpr(ctx, e.res);
}

function iAssert(b) {
    if (not(b)) {
        console.log("ASSERT FAILED");
    }
}

/*
// cannot parse because many features are lacking
function iStrip(o) {
    if (o.t === "obj val") {
        var n = {};
        for (var p in o.val) {
            n[p] = iStrip(o.val[p]);
        }
        return n;
    }
    if (o.t === "array val") {
        return o.val.map(function(a) { return iStrip(a); });
    }
    return o.val;
}
*/

function iTests() {
    var ctx = iCreateCtx();

    var expr = pParse(pExpr, '1+2*4+7');
    iAssert(iEvalExpr(ctx, expr.res).val === 16);

    var fn = " 'use strict'; var a = 0; function main() { a = 1; } main(); ";
    var expr = pParse(pSrc, fn);
    iEvalSrc(ctx, expr.res);
    iAssert(ctx.globals.a.val === 1);
    iEval(ctx, "pParse(pFunction, 'function f(x) { var a = 4; if (a) { } else if { n = a; } else { a = a; } }')");
    iEval(ctx, "pParse(pFunction, 'function f(x) { var a = 4; if (a) { } else if (this) { n = a; } else { a = a; } }')");
}

function iInterpreatParserToParseParserTest() {

    var pc = codeTT.value;
    var e = pParse(pExpr, "pParse(pSrc, 'put suff here')");
    e = e.res;
    e.rest[0].funcParams[1].val = pc;
    var r = iEvalExpr(ctx, e);

    return r;
}


// vim:sts=4:sw=4

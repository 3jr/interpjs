// p Prefix: functions that are parsers and helper functions and variables
// f Prefix: functions that transform the result to a useful ast
// pf Prefix: functions that are parsers and take a transform function
// l Prefix: lexme
// Im Postfix: Implementation
//
// Variable/Parameter Names explained
// p : parser
// s : stream
// i : position in stream (names pos in Succ and Ret)
// res : result of parsing

//'use strict';

function pParserlog(msg) {
    //console.log(msg);
}

// TODO combine utils
function pHasOwnProperty(obj, name) {
    return Object.prototype.hasOwnProperty.call(obj, name);
}


function not(b) {
    if (b === true) {
        return false;
    }
    if (b === false) {
        return true;
    } // else undefined
}

function isLetterChar(str) {
    var c = str.charCodeAt(0);
    return (65 <= c && c <= 90) || (97 <= c && c <= 122);
}

function isNumChar(str) {
    var c = str.charCodeAt(0);
    return 47 <= c && c <= 57;
}

function isWhitespaceChar(str) {
    var c = str.charCodeAt(0);
    return c === 32 || // space
            c === 10 || // \n
            c === 13;// \r
}

function pAParse(p, s, i) {
    var r = p.p(s, i);
    if (r.t === "Succ" && pHasOwnProperty(p, "f")) {
        r.res = p.f(r.res);
    }
    return r;
}

function pSucc(i, res) {
    return {
        t: "Succ", /* type */
        pos: i, /* position in stream */
        res: res /* result of parsing */
    };
}

function pFail(i, msg) {
    return {
        t: "Fail", /* type */
        pos: i, /* position in stream */
        msg: msg /* result of parsing */
    };
}

function pIdentIm(s, i) {
    var id = '';
    if (isLetterChar(s[i])) {
        id = id + s[i];
        i = i + 1;
    } else {
        return pFail(i, "identifier must start with letter");
    }
    while (isLetterChar(s[i]) || isNumChar(s[i]) || s[i] === '_') {
        id = id + s[i];
        i = i + 1;
    }
    //pParserlog(i + ': id "' + id + '"');
    return pSucc(i, id);
}

var pIdent = {
    p: pIdentIm
};

function pFloatIm(s, i) {
    if (not(isNumChar(s[i]))) {
        return pFail(i, "expected float");
    }
    var res = "";
    while (isNumChar(s[i])) {
        res = res + s[i];
        i = i + 1;
    }
    if (s[i] === "." && isNumChar(s[i + 1])) {
        res = res + s[i];
        i = i + 1;
        while (isNumChar(s[i])) {
            res = res + s[i];
            i = i + 1;
        }
    }
    if (isLetterChar(s[i])) {
        return pFail(i, "number ends in letter");
    }
    return pSucc(i, res);
}

var pFloat = {
    p: pFloatIm
};

function pPrintDebugInfo(found, iold, i, str, s) {
    if (found) {
        //pParserlog(iold + ': found "' + str + '"');
        //pParserlog(i + ': next 10: "' + s.substring(i, i+10) + '"');
    } else {
        //pParserlog(iold + ': expected "' + str + '"');
    }
}

function pStrIm(s, i) {
    var str = this.str;
    var iold = i;
    var j = 0;
    while (j < str.length && s[i] === str[j]) {
        i = i + 1;
        j = j + 1;
    }
    if (j === str.length) {
        pPrintDebugInfo(true, iold, i, str, s);
        return pSucc(i, str);
    } else {
        pPrintDebugInfo(false, iold, i, str, s);
        return pFail(iold, 'expected "' + str + '"');
    }
}
function pStr(str) {
    return {
        p: pStrIm,
        str: str
    };
}

function pKeywordIm(s, i) {
    var keyword = this.keyword;
    var iold = i;
    var j = 0;
    while (j < keyword.length && s[i] === keyword[j]) {
        i = i + 1;
        j = j + 1;
    }
    if (j === keyword.length &&
            not(isLetterChar(s[i])) && not(isNumChar(s[i]))) {
        pPrintDebugInfo(true, iold, i, keyword, s);
        return pSucc(i, keyword);
    } else {
        pPrintDebugInfo(false, iold, i, keyword, s);
        return pFail(iold, 'expected "' + keyword + '"');
    }
}

function pKeyword(keyword) {
    return {
        p: pKeywordIm,
        keyword: keyword
    };
}

function pQuotedIm(s, i) {
    var q = s[i];
    if (q !== '"' && q !== "'") {
        return pFail(i, "expected quoat");
    }
    i = i + 1;
    var str = q;
    while (s[i] !== q) {
        if (s[i] === "\\") {
            if (s[i + 1] === "'") {
                str = str + "'";
                i = i + 2;
            } else if (s[i + 1] === '"') {
                str = str + '"';
                i = i + 2;
            } else if (s[i + 1] === "n") {
                str = str + "\n";
                i = i + 2;
            } else if (s[i + 1] === "r") {
                str = str + "\r";
                i = i + 2;
            } else if (s[i + 1] === "t") {
                str = str + "\t";
                i = i + 2;
            } else if (s[i + 1] === "\\") {
                str = str + "\\";
                i = i + 2;
            } else {
                return pFail(i, 'unknown escape sequence in string literal');
            }
        } else {
            str = str + s[i];
            i = i + 1;
        }
    }
    str = str + s[i];
    i = i + 1;
    //pParserlog(i + ': strLit "' + str + '"');
    return pSucc(i, str);
}

var pQuoted = {
    p: pQuotedIm
};

function pSkipSpaceIm(s, i) {
    var ws = '';
    while (true) {
        if (isWhitespaceChar(s[i])) {
            ws = ws + s[i];
            i = i + 1;
        } else if (s[i] === "/") {
            if (s[i + 1] === "/") {
                ws = ws + s[i] + s[i + 1];
                i = i + 2;

                while (s[i - 1] !== "\n") {
                    ws = ws + s[i];
                    i = i + 1;
                }
            } else if (s[i + 1] === "*") {
                ws = ws + s[i] + s[i + 1] + s[i + 2];
                i = i + 3;

                while (s[i - 2] !== "*" || s[i - 1] !== "/") {
                    ws = ws + s[i];
                    i = i + 1;
                }
            } else {
                break;
            }
        } else {
            break;
        }
    }
    //pParserlog(i + ': ws "' + ws + '"');
    return pSucc(i, ws);
}

var pSkipSpace = {
    p: pSkipSpaceIm
};

function pSeqIm(s, i) {
    var seq = this.seq;
    var atomic = this.atomic;
    var oldi = i;
    var res = [];
    var j = 0;
    var r = null;
    while (j < seq.length) {
        r = pAParse(seq[j], s, i);
        if (r.t === "Fail") {
            if (atomic === true) {
                return pFail(oldi, r.msg);
            } else {
                return r;
            }
        }
        i = r.pos;
        res.push(r.res);
        j = j + 1;
    }
    return pSucc(i, res);
}

function pSeq(seq) {
    return {
        p: pSeqIm,
        seq: seq,
        atomic: false
    };
}

function pfSeq(seq, f) {
    return {
        p: pSeqIm,
        seq: seq,
        atomic: false,
        f: f
    };
}

function pAtomicSeq(seq) {
    return {
        p: pSeqIm,
        seq: seq,
        atomic: true
    };
}

function pfAtomicSeq(seq, f) {
    return {
        p: pSeqIm,
        seq: seq,
        atomic: true,
        f: f
    };
}

function pAnyIm(s, i) {
    var any = this.any;
    var j = 0;
    var r = null;
    while (j < any.length) {
        r = pAParse(any[j], s, i);
        if (r.t === "Succ") {
            return r;
        }
        if (r.pos !== i) {
            return pFail(i, "something in any got somewhere");
        }
        j = j + 1;
    }
    return pFail(i, "nothing mached in any");
}

function pAny(any) {
    return {
        p: pAnyIm,
        any: any
    };
}

function pfAny(any, f) {
    return {
        p: pAnyIm,
        any: any,
        f: f
    };
}

function pOptIm(s, i) {
    var pInner = this.pInner;
    var r = pAParse(pInner, s, i);
    if (r.t === "Fail") {
        if (r.pos === i) {
            return pSucc(i, null);
        } else {
            return pFail(i, 'partial match in opt');
        }
    }
    return r;
}

function pOpt(pInner) {
    return {
        p: pOptIm,
        pInner: pInner
    };
}

function pfOpt(pInner, f) {
    return {
        p: pOptIm,
        pInner: pInner,
        f: f
    };
}

function pManyIm(s, i) {
    var pInner = this.pInner;
    var r = null;
    var seq = [];
    while (true) {
        r = pAParse(pInner, s, i);
        if (r.t === "Fail") {
            if (r.pos === i) {
                return pSucc(i, seq);
            } else {
                return r;
            }
        }
        i = r.pos;
        seq.push(r.res);
    }
}

function pMany(pInner) {
    return {
        p: pManyIm,
        pInner: pInner
    };
}

function pfMany(pInner, f) {
    return {
        p: pManyIm,
        pInner: pInner,
        f: f
    };
}

function pSepByIm(s, i) {
    var pInner = this.pInner;
    var pSep = this.pSep;
    var r = null;
    var seq = [];
    r = pAParse(pInner, s, i);
    if (r.t === "Fail") {
        return pSucc(i, seq);
    }
    i = r.pos;
    while (true) {
        seq.push(r.res);
        r = pAParse(pSep, s, i);
        if (r.t === "Succ") {
            i = r.pos;
            seq.push(r.res);
        } else {
            break;
        }
        r = pAParse(pInner, s, i);
        if (r.t === "Fail") {
            return r;
        }
        i = r.pos;
    }
    return pSucc(i, seq);
}

function pSepBy(pInner, pSep) {
    return {
        p: pSepByIm,
        pInner: pInner,
        pSep: pSep
    };
}

function pfSepBy(pInner, pSep, f) {
    return {
        p: pSepByIm,
        pInner: pInner,
        pSep: pSep,
        f: f
    };
}

function fN0(ast) {
    return ast[0];
}

function fN1(ast) {
    return ast[1];
}

function fN2(ast) {
    return ast[2];
}

function fEven(ast) {
    var r = [];
    var i = 0;
    while (i < ast.length) {
        r.push(ast[i]);
        i = i + 2;
    }
    return r;
}

// start of custome stuff

function lexme(str) {
    return pfSeq([pStr(str), pSkipSpace], fN0);
}
function lexmeKeyword(str) {
    return pfSeq([pKeyword(str), pSkipSpace], fN0);
}

function fId(ast) {
    return {
        t: "id",
        idName: ast[0]
    };
}
var pId = pfSeq([pIdent, pSkipSpace], fId);

// lexmes:
var lFunc = lexmeKeyword("function");
var lVar = lexmeKeyword("var");
var lIf = lexmeKeyword("if");
var lElse = lexmeKeyword("else");
var lWhile = lexmeKeyword("while");
var lReturn = lexmeKeyword("return");
var lBreak = lexmeKeyword("break");
var lContinue = lexmeKeyword("continue");

var lThis = lexmeKeyword("this");
var lNull = lexmeKeyword("null");
var lUndef = lexmeKeyword("undefined");

var lTrue = lexmeKeyword("true");
var lFalse = lexmeKeyword("false");

var lEqualSign = lexme("=");
var lDot = lexme(".");
var lComma = lexme(",");
var lColon = lexme(":");
var lSemi = lexme(";");

var lPlus = lexme("+");
var lMinus = lexme("-");

var lStar = lexme("*");
var lFSlash = lexme("/");
var lPercent = lexme("%");

var lOr = lexme("||");
var lAnd = lexme("&&");

var lBSlash = lexme("\\");

var lEq3 = lexme("===");
var lNEq3 = lexme("!==");
var lLess = lexme("<");
var lGreater = lexme(">");
var lLessEq = lexme("<=");
var lGreaterEq = lexme(">=");

var lLParen = lexme("(");
var lRParen = lexme(")");
var lLBrace = lexme("{");
var lRBrace = lexme("}");
var lLBracket = lexme("[");
var lRBracket = lexme("]");

function pComma(pInner) {
    return pfSepBy(pInner, lComma, fEven);
}

function pParenIm(s, i) {
    var pInner = this.pInner;
    return pAParse(pfSeq([
        lLParen,
        pInner,
        lRParen
    ], fN1), s, i);
}

function pParen(pInner) {
    return {
        p: pParenIm,
        pInner: pInner
    };
}

function pfParen(pInner, f) {
    return {
        p: pParenIm,
        pInner: pInner,
        f: f
    };
}

function pBracesIm(s, i) {
    var pInner = this.pInner;
    return pAParse(pfSeq([
        lLBrace,
        pInner,
        lRBrace
    ], fN1), s, i);
}

function pBraces(pInner) {
    return {
        p: pBracesIm,
        pInner: pInner
    };
}

function pfBraces(pInner, f) {
    return {
        p: pBracesIm,
        pInner: pInner,
        f: f
    };
}

function pBracketsIm(s, i) {
    var pInner = this.pInner;
    return pAParse(pfSeq([
        lLBracket,
        pInner,
        lRBracket
    ], fN1), s, i);
}

function pBrackets(pInner) {
    return {
        p: pBracketsIm,
        pInner: pInner
    };
}

function pfBrackets(pInner, f) {
    return {
        p: pBracketsIm,
        pInner: pInner,
        f: f
    };
}

function pExprIndirection(s, i) {
    return pAParse(pExprRef, s, i);
}
var pExpr = {
    p: pExprIndirection
};

function pBlockIndirection(s, i) {
    return pAParse(pBlockRef, s, i);
}
var pBlock = {
    p: pBlockIndirection
};

function fVar(ast) {
    return {
        t: "var decl stmt",
        varId: ast[1].idName,
        expr: ast[2]
    };
}

var pVar = pfSeq([
    lVar,
    pId,
    pfSeq([lEqualSign, pExpr], fN1),
    lSemi
], fVar);

function fIf(ast) {
    return {
        t: "if stmt",
        cond: ast[1],
        block: ast[2],
        elseifBranches: ast[3],
        elseBlock: ast[4]
    };
}

function fElseIf(ast) {
    return {
        t: "else if stmt",
        cond: ast[1],
        block: ast[2]
    };
}

var pIf = pfSeq([
    lIf,
    pParen(pExpr),
    pBlock,
    pMany(pfSeq([
        pAtomicSeq([lElse, lIf]),
        pParen(pExpr),
        pBlock
    ], fElseIf)),
    pOpt(pfSeq([
        lElse,
        pBlock
    ], fN1))
], fIf);

function fWhile(ast) {
    return {
        t: "while stmt",
        cond: ast[1],
        block: ast[2]
    };
}

var pWhile = pfSeq([lWhile, pParen(pExpr), pBlock], fWhile);

function fReturn(ast) {
    return {
        t: "return stmt",
        expr: ast[1]
    };
}

var pReturn = pfSeq([lReturn, pOpt(pExpr), lSemi], fReturn);

function fBreak(ast) {
    return {t: "break stmt"};
}

var pBreak = pfSeq([lBreak, lSemi], fBreak);

function fContinue(ast) {
    return {t: "continue stmt"};
}

var pContinue = pfSeq([lContinue, lSemi], fContinue);

function fAssignExprStmt(ast) {
    if (ast[1] === null) {
        return {
            t: "expr stmt",
            expr: ast[0]
        };
    } else {
        if (ast[0].t !== "id" && ast[0].t !== "expr2") {
            // TODO 'func call is actually not allowed'
            return {
                t: "error",
                msg: "too complex expression on left hand side of assignment"
            };
        }
        return {
            t: "assign stmt",
            left: ast[0],
            expr: ast[1]
        };
    }
}

var pAssignExprStmt = pfSeq([
    pExpr,
    pOpt(pfSeq([lEqualSign, pExpr], fN1)),
    lSemi
], fAssignExprStmt);

var pStmt = pAny([
    pVar,
    pIf,
    pWhile,
    pReturn,
    pBreak,
    pContinue,
    pAssignExprStmt
]);

var pBlockRef = pBraces(pMany(pStmt));

function fFunction(ast) {
    var paramNames = [];
    var i = 0;
    while (i < ast[2].length) {
        paramNames.push(ast[2][i].idName);
        i = i + 1;
    }
    return {
        t: "func decl",
        funcName: ast[1].idName,
        params: paramNames,
        block: ast[3]
    };
}

var pFunction = pfSeq([
    lFunc,
    pId,
    pParen(pComma(pId)),
    pBlock
], fFunction);

var pItem = pAny([
    pFunction,
    pVar
]);

function pNumStrToNum(str) {
    var nullNum = "0".charCodeAt(0);
    var i = 0;
    var res = 0;
    while (i < str.length && str[i] !== ".") {
        var c = str.charCodeAt(i) - nullNum;
        res = res * 10;
        res = res + c;
        i = i + 1;
    }
    if (str[i] === ".") {
        i = i + 1;
        var factor = 1 / 10;
        while (i < str.length) {
            var c = str.charCodeAt(i) - nullNum;
            res = res + c * factor;
            factor = factor / 10;
            i = i + 1;
        }
    }
    return res;
}

function fNumberLit(ast) {
    return {
        t: "num lit",
        val: pNumStrToNum(ast[0])
    };
}

var pNumberLit = pfSeq([pFloat, pSkipSpace], fNumberLit);

function fStringLit(ast) {
    // This code does something like: var s = ast[0].slice(1,-1);
    var s = "";
    var i = 1;
    while (i < ast[0].length - 1) {
        s = s + ast[0][i];
        i = i + 1;
    }
    return {
        t: "str lit",
        val: s
    };
}

var pStringLit = pfSeq([pQuoted, pSkipSpace], fStringLit);

function fThis(ast) {
    return {
        t: "this expr"
    };
}

var pThis = pfAny([lThis], fThis);


function fNull(ast) {
    return {
        t: "null expr"
    };
}

var pNull = pfAny([lNull], fNull);

function fUndef(ast) {
    return {
        t: "undef expr"
    };
}

var pUndef = pfAny([lUndef], fUndef);

function fBoolLit(ast) {
    if (ast === "true") {
        return {
            t: "bool lit",
            val: true
        };
    } else {
        return {
            t: "bool lit",
            val: false
        };
    }
}

var pBoolLit = pfAny([lTrue, lFalse], fBoolLit);

function fArrayLit(ast) {
    return {
        t: "array lit",
        val: ast
    };
}

var pArrayLit = pfBrackets(pComma(pExpr), fArrayLit);

function fObjLit(ast) {
    return {
        t: "obj lit",
        val: ast
    };
}

function fObjLitEntry(ast) {
    var idx = null;
    if (ast[0].t === "id") {
        idx = ast[0].idName;
    } else if (ast[0].t === "str lit") {
        idx = ast[0].val;
    }
    return {
        t: "obj lit entry",
        idx: idx,
        expr: ast[2]
    };
}

var pObjLit = pfBraces(pComma(
    pfSeq([
        pAny([pId,pStringLit]),
        lColon,
        pExpr
    ], fObjLitEntry)
), fObjLit);


var pBinOps = [
    [lStar, lFSlash, lPercent],
    [lPlus, lMinus],
    [lEq3, lNEq3],
    [lLessEq, lGreaterEq, lLess, lGreater],
    [lAnd],
    [lOr]
];

var pExpr1 = pAny([
    pThis,
    pNull,
    pUndef,
    pBoolLit,
    pNumberLit,
    pStringLit,
    pArrayLit,
    pObjLit,
    pParen(pExpr),
    pId
]);

function fFuncCall(ast) {
    return {
        t: "func call",
        funcParams: ast
    };
}

function fArrayIndex(ast) {
    return {
        t: "array index",
        indexExpr: ast
    };
}

function fDotted(ast) {
    return {
        t: "dotted",
        dotName: ast[1].idName
    };
}

function fExpr2(ast) {
    if (ast[1].length === 0) {
        return ast[0];
    } else {
        return {
            t: "expr2",
            innermost: ast[0],
            rest: ast[1]
        };
    }
}

var pExpr2 = pfSeq([
    pExpr1,
    pMany(
        pAny([
            pfSeq([lDot, pId], fDotted),
            pfParen(pComma(pExpr), fFuncCall),
            pfBrackets(pExpr, fArrayIndex)
        ])
    )
], fExpr2);

function fBinOp(ast) {
    if (ast[1].length === 0) {
        return ast[0];
    }
    var operants = [ast[0]];
    var operators = [];
    var i = 0;
    while (i < ast[1].length) {
        operators.push(ast[1][i][0]);
        operants.push(ast[1][i][1]);
        i = i + 1;
    }
    return {
        t: "bin op expr",
        operants: operants,
        operators: operators
    };
}

function generateExpr() {
    var i = 0;
    var p = pExpr2;
    while (i < pBinOps.length) {
        p = pfSeq([
            p,
            pMany(pSeq([
                pAny(pBinOps[i]),
                p
            ]))
        ], fBinOp);
        i = i + 1;
    }
    return p;
}

var pExprRef = generateExpr();

var pSrc = pfSeq([
        pSkipSpace,
        // TODO reenable 'use strict'; 
        //pSeq([pStr("'use strict';"), pSkipSpace]),
        pMany(pItem)
    //], fN2);
    ], fN1);

function pParse(parser, str) {
    var endMarker = String.fromCharCode(26);
    return pAParse(pfSeq([parser,pStr(endMarker)],fN0), str + endMarker, 0);
}

function pTests() {
    var sws = pSkipSpace;
    pParse(pMany(pAny([pStr('1'), sws])), '111');
    pParse(pMany(pAny([
        pSeq([pStr('1'), sws]),
        pSeq([pId, sws])
    ])), '1 1     1    a     a    a basd ');
    pParse(pComma(pAny([pStr('1'), pStr('2')])), '1,2,1,2,2,1,1,2,2');
    pParse(pFunction, 'function f(x) { var a = 4; if (a) { } else if { n = a; } else { a = a; } }');
    var tsrc = 'var pIdent = { p: pdentm };function pFloatIm(s, i) { if (isNumChar(s[i])) { return pFail(i, "expected float"); } var res = ""; while (isNumChar(s[i])) { res = res + s[i]; i = i + 1; } if (s[i] === "." && isNumChar(s[i+1])) { res = res + s[i]; i = i + 1; while (isNumChar(s[i])) { res = res + s[i]; i = i + 1; } } if (isLetterChar(s[i])) { return pFail(i, "number ends in letter"); } return pSucc(i, res);}var pFloat = { p: pFloatIm } ;';
    return pParse(pSrc, tsrc);
}

// vim:sts=4:sw=4

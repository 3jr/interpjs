//
// p Prefix: function that are parsers
// Im Postfix: Implementation
//
// Variable/Parameter Names explained
// p : parser
// s : stream
// i : position in stream (names pos in Succ and Ret)
// res : result of parsing

'use strict';

function not(b) {
    if (b === true) {
        return false;
    } else if (b === false) {
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

function parse(p, s, i) {
    if (i === undefined || i === null) {
        i = 0;
        s = s + String.fromCharCode(26);
    }
    var r = p.p(s, i);
    if (r.t === "Succ" && p.f !== undefined) {
        r.ast = p.f(r.ast);
    } else {
        r.ast = r.res;
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
    while (isLetterChar(s[i]) || isNumChar(s[i])) {
        id = id + s[i];
        i = i + 1;
    }
    console.log(i + ': id "' + id + '"');
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

function pStrIm(s, i) {
    var str = this.str;
    var iold = i;
    var j = 0;
    while (j < str.length && s[i] === str[j]) {
        i = i + 1;
        j = j + 1;
    }
    if (j === str.length) {
        console.log(iold + ': found "' + str + '"');
        return pSucc(i, str);
    } else {
        console.log(iold + ': expected "' + str + '"');
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
        console.log(iold + ': found "' + keyword + '"');
        return pSucc(i, keyword);
    } else {
        console.log(iold + ': expected "' + keyword + '"');
        return pFail(iold, 'expected "' + keyword + '"');
    }
}

function pKeyword(keyword) {
    return {
        p: pKeywordIm,
        keyword: keyword
    };
}

function pQuatedStringIm(s, i) {
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
    console.log(i + ': strLit "' + str + '"');
    return pSucc(i, str);
}

var pQuatedString = {
    p: pQuatedStringIm
};

function pQuoatedString(f) {
    return {
        p: pQuatedStringIm,
        f: f
    };
}

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
                ws = ws + s[i] + s[i + 1] + s [i + 2];
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
    //console.log(i + ': ws "' + ws + '"');
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
    var r;
    while (j < seq.length) {
        r = parse(seq[j], s, i);
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

function pAtomicSeq(seq) {
    return {
        p: pSeqIm,
        seq: seq,
        atomic: true
    };
}

function pAnyIm(s, i) {
    var any = this.any;
    var j = 0;
    var r;
    while (j < any.length) {
        r = parse(any[j], s, i);
        if (r.t === "Succ") {
            return pSucc(r.pos, r.res);
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

function pOptIm(s, i) {
    var pInner = this.pInner;
    var r = parse(pInner, s, i);
    if (r.t === "Fail") {
        if (r.pos === i) {
            return pSucc(i, '');
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

function pManyIm(s, i) {
    var pInner = this.pInner;
    var r;
    var seq = [];
    while (true) {
        r = parse(pInner, s, i);
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

function pSepByIm(s, i) {
    var pInner = this.pInner;
    var pSep = this.pSep;
    var r;
    var seq = [];
    r = parse(pInner, s, i);
    if (r.t === "Fail") {
        return pSucc(i, seq);
    }
    i = r.pos;
    while (true) {
        seq.push(r.res);
        r = parse(pSep, s, i);
        if (r.t === "Succ") {
            i = r.pos;
            seq.push(r.res);
        } else {
            break;
        }
        r = parse(pInner, s, i);
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

// start of custome stuff

function lexme(str) {
    return pSeq([pStr(str), pSkipSpace]);
}
function lexmeKeyword(str) {
    return pSeq([pKeyword(str), pSkipSpace]);
}
var pId = pSeq([pIdent, pSkipSpace]);

// lexmes:
var lFunc = lexmeKeyword("function");
var lVar = lexmeKeyword("var");
var lIf = lexmeKeyword("if");
var lElse = lexmeKeyword("else");
var lWhile = lexmeKeyword("while");
var lReturn = lexmeKeyword("return");
var lBreak = lexmeKeyword("break");
var lContinue = lexmeKeyword("continue");

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
    return pSepBy(pInner, lComma);
}

function pParenIm(s, i) {
    var pInner = this.pInner;
    return parse(pSeq([
        lLParen,
        pInner,
        lRParen
    ]), s, i);
}

function pParen(pInner) {
    return {
        p: pParenIm,
        pInner: pInner
    };
}

function pBracesIm(s, i) {
    var pInner = this.pInner;
    return parse(pSeq([
        lLBrace,
        pInner,
        lRBrace
    ]), s, i);
}

function pBraces(pInner) {
    return {
        p: pBracesIm,
        pInner: pInner
    };
}

function pBracketsIm(s, i) {
    var pInner = this.pInner;
    return parse(pSeq([
        lLBracket,
        pInner,
        lRBracket
    ]), s, i);
}

function pBrackets(pInner) {
    return {
        p: pBracketsIm,
        pInner: pInner
    };
}

function pExprIndirection(s, i) {
    return parse(pExprRef, s, i);
}
var pExpr = {
    p: pExprIndirection
};

function pBlockIndirection(s, i) {
    return parse(pBlockRef, s, i);
}
var pBlock = {
    p: pBlockIndirection
};

var pVar = pSeq([
    lVar,
    pId,
    pOpt(pSeq([lEqualSign, pExpr])),
    lSemi
]);

var pIf = pSeq([
    lIf,
    pParen(pExpr),
    pBlock,
    pMany(pSeq([
        pAtomicSeq([lElse, lIf]),
        pParen(pExpr),
        pBlock
    ])),
    pOpt(pSeq([
        lElse,
        pBlock
    ]))
]);

var pWhile = pSeq([lWhile, pParen(pExpr), pBlock]);

var pReturn = pSeq([lReturn, pOpt(pExpr), lSemi]);
var pBreak = pSeq([lBreak, lSemi]);
var pContinue = pSeq([lContinue, lSemi]);

var pAssignExpr = pSeq([
    pExpr,
    pOpt(pSeq([lEqualSign, pExpr])),
    lSemi
]);

var pStmt = pAny([
    pVar,
    pIf,
    pWhile,
    pReturn,
    pBreak,
    pContinue,
    pAssignExpr
]);

var pBlockRef = pBraces(pMany(pStmt));

var pFunction = pSeq([
    lFunc,
    pId,
    pParen(pComma(pId)),
    pBlock
]);

var pItem = pAny([
    pFunction,
    pVar,
    pSeq([pStr("'use strict';"), pSkipSpace]),
    pSeq([pStr("main();"), pSkipSpace])
]);

var pNumberLit = pSeq([pFloat, pSkipSpace]);
var pStringLit = pSeq([pQuatedString, pSkipSpace]);
var pBoolLit = pAny([lTrue, lFalse]);
var pArrayLit = pBrackets(pComma(pExpr));
var pObjLit = pBraces(pComma(
    pSeq([
        pAny([pStringLit, pId]),
        lColon,
        pExpr
    ])
));


var binOps = [
    [lStar, lFSlash, lPercent],
    [lPlus, lMinus],
    [lEq3, lNEq3],
    [lLessEq, lGreaterEq, lLess, lGreater],
    [lAnd],
    [lOr]
];

var pExpr1 = pAny([
    pBoolLit,
    pNumberLit,
    pStringLit,
    pArrayLit,
    pObjLit,
    pParen(pExpr),
    pId
]);

var pExpr2 = pSeq([
    pExpr1,
    pMany(
        pAny([
            pSeq([lDot, pId]),
            pParen(pComma(pExpr)),
            pBrackets(pExpr)
        ])
    )
]);

function generateExpr() {
    var i = 0;
    var p = pExpr2;
    while (i < binOps.length) {
        p = pSeq([
            p,
            pMany(pSeq([
                pAny(binOps[i]),
                p
            ]))
        ]);
        i = i + 1;
    }
    return p;
}

var pExprRef = generateExpr();

var pSrc = pSeq([pSkipSpace, pMany(pItem), pStr(String.fromCharCode(26))]);

function tests() {
    var sws = pSkipSpace;
    parse(pMany(pAny([pStr('1'), sws])), '111');
    parse(pMany(pAny([
        pSeq([pStr('1'), sws]),
        pSeq([pId, sws])
    ])), '1 1     1    a     a    a basd ');
    parse(pComma(pAny([pStr('1'), pStr('2')])), '1,2,1,2,2,1,1,2,2');
    parse(pFunction, 'function f(x) { var a = 4; if (a) { } else if { n = a; } else { a = a; } }');
    var tsrc = 'var pIdent = { p: pdentm };function pFloatIm(s, i) { if (isNumChar(s[i])) { return pFail(i, "expected float"); } var res = ""; while (isNumChar(s[i])) { res = res + s[i]; i = i + 1; } if (s[i] === "." && isNumChar(s[i+1])) { res = res + s[i]; i = i + 1; while (isNumChar(s[i])) { res = res + s[i]; i = i + 1; } } if (isLetterChar(s[i])) { return pFail(i, "number ends in letter"); } return pSucc(i, res);}var pFloat = { p: pFloatIm } ;';
    parse(pSrc, tsrc);
}

/* vim:sts=4:sw=4:noet */

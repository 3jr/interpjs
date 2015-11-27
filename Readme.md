This is a joke project. It's so bad that it's probably not worth you time.

A proof of concept for a javascript1 parser and interpreter written in
javascript. It only supports a small subset of javascript (to make it easier
to implement and to disallow some unwanted javascript features). The
interpreter is written in javascript1 so it can interpret it self (there is
likely no other large piece of code written in javascript1).

Some properties of javascript1:

- there is probably some subset of javascript and javascript1 that is
  has the same semantics in both (and is Turing complete)

- only top level functions (so no captures; but 'this' still works) (yet)
- no prototypes or anything similar to that
- no unary operators (just write your own not() function with an if)
- only some binary operators (no wired conversions for strings)
        - on everything: === !==
        - on strings: + < > <= >=
        - on numbers: * / % + - < > <= >=
        - on bools: && ||
- arrays are different from objects
        - objects can only be indexed with strings
        - arrays can only be indexed with numbers and they must be non negative
          integers
- no for loops (yet)
- must use braces on blocks


### Parser

The parser is kept at a minimum. It is the most simple parser combinator I
could think of.

### Motivation

This was originally intended to test weather it makes sense to implement a
small interpreter for teaching purposes (That doesn't seem to be the case).





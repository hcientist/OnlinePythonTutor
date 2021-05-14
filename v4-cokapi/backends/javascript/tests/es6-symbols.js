// adapted from http://es6-features.org/#SymbolType
var x = Symbol("xxx")
var y = Symbol("yyy");
console.log(x !== y);
const foo = Symbol('foo');
const bar = Symbol('bar');
console.log(typeof foo === "symbol");
console.log(typeof bar === "symbol");
let obj = {};
obj[foo] = "foo";
obj[bar] = "bar";
console.log(JSON.stringify(obj)); // {}
console.log(Object.keys(obj)); // []
console.log(Object.getOwnPropertyNames(obj)); // []
console.log(Object.getOwnPropertySymbols(obj)); // [ foo, bar ]

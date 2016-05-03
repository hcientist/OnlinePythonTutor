// adapted from http://es6-features.org/#SetDataStructure
let s = new Set();
s.add("hello").add("goodbye");
s.add("hello");
s.add("foo");
s.delete("foo");
console.log(s.size === 2);
console.log(s.has("hello") === true);
for (let key of s.values()) // insertion order
    console.log(key);

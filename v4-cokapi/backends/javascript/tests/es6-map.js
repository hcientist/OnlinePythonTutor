// adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
var myMap = new Map();

var keyString = "a string",
    keyObj = {},
    keyFunc = function () {};

// setting the values
myMap.set(keyString, "value associated with 'a string'");
myMap.set(keyObj, "value associated with keyObj");
myMap.set(keyFunc, "value associated with keyFunc");

console.log(myMap.size === 3); // 3

// getting the values
console.log(myMap.get(keyString));     // "value associated with 'a string'"
console.log(myMap.get(keyObj));        // "value associated with keyObj"
console.log(myMap.get(keyFunc));       // "value associated with keyFunc"

console.log(myMap.get("a string"));    // "value associated with 'a string'"
                                       // because keyString === 'a string'
console.log(myMap.get({}));            // undefined, because keyObj !== {}
console.log(myMap.get(function() {})); // undefined, because keyFunc !== function () {}

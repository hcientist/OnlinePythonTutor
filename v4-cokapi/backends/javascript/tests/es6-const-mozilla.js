// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const

// define MY_FAV as a constant and give it the value 7
const MY_FAV = 7;

// will print 7
console.log("my favorite number is: " + MY_FAV);

// MY_FAV is still 7
console.log("my favorite number is " + MY_FAV);

// Assigning to A const variable is a syntax error
const A = 1;

// const also works on objects
const MY_OBJECT = {"key": "value"};

// Overwriting the object fails as above (in Firefox and Chrome but not in Safari)
MY_OBJECT = {"OTHER_KEY": "value"};

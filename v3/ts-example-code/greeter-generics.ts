// adapted from an example at http://www.typescriptlang.org/Playground
class Greeter<T> {
    greeting: T;
    constructor(message: T) {
        this.greeting = message;
    }
    greet() {
        return this.greeting;
    }
}

var strGreeter = new Greeter<string>("Hello, world");
console.log(strGreeter.greet());

// change x to a number to fix error
var x = 'not a number';
var numGreeter = new Greeter<number>(x);
console.log(numGreeter.greet());

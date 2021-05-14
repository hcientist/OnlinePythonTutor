var globalZ = 10;

function foo(y) {
    function bar(x) {
        globalZ += 100;
        return x + y + globalZ;
    }
    return bar;
}

var b = foo(1);
b(2);

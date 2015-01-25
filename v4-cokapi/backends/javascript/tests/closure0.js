function foo(y) {
    function bar(x) {
        return x + y;
    }
    y *= 3;
}

foo(10);
foo(20);
foo(30);

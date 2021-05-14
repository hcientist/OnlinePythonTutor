var x = 10; // global
function foo() {
  var x = 10;
  function bar() {
    var y = x;
    x *= 2;
    console.log(x, y);
  }
  bar();
}
foo();

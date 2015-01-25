var x = 10; // global
function foo() {
  var x = 10;
  function bar() {
    var y = x;
    x *= 2;
    console.log(x, y);
  }
  return bar;
}
var b = foo();
// x inside of bar should be the x in foo, *not* the global x
b(); 

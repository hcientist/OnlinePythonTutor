var global_x = 5;
var global_y = 10;

var foo = function (i) {
  var local_x = 42;
  var local_y = "hello world";
  var local_z = true;
  var local_w = false;
  var local_q = null;
  console.log('foo:', i*i);
  bar(i);
  return (local_x * local_x);
}

function bar(i) {
  var obj_lst = [i, {foo: i+1, poop: [1, 2, 3]}, {bar: i+2}];
}

for (var i=0; i<3; i++) {
  foo(i)
}

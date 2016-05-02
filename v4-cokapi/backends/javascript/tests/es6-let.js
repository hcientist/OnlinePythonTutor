function foo() {
  var xxx = 5;
  if (true) {
    let xxx = 10;
    console.log(xxx);
  }
  console.log(xxx);
}

foo()

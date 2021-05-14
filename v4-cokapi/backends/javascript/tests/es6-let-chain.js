function foo() {
  var xxx = 5;
  console.log(xxx);
  if (true) {
    let xxx = 6;
    console.log(xxx);
    if (true) {
      let xxx = 7;
      console.log(xxx);
      if (true) {
        let xxx = 8;
        console.log(xxx);
        bar();
      }
    }
  }
}

function bar() {
  var xxx = 9;
  console.log(xxx);
  if (true) {
    let xxx = 10;
    console.log(xxx);
    if (true) {
      let xxx = 11;
      console.log(xxx);
      if (true) {
        let xxx = 12;
        console.log(xxx);
      }
    }
  }
}


let xxx = 1;
console.log(xxx);
if (true) {
  let xxx = 2;
  console.log(xxx);
  if (true) {
    let xxx = 3;
    console.log(xxx);
    if (true) {
      let xxx = 4;
      console.log(xxx);
      foo();
    }
  }
}
console.log(xxx);

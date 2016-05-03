function foo() {
  let xxx = 5;
  if (true) {
    let xxx = 10;
    console.log(xxx);
    if (true) {
      let xxx = 20;
      console.log(xxx);
      if (true) {
        let xxx = 30;
        console.log(xxx);
      }
    }
  }
  console.log(xxx);
}

foo()

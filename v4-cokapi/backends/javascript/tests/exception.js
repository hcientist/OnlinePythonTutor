// adapted from OPT Python example
// Tutorial code from Prof. Peter Wentworth
// Rhodes University, South Africa (http://www.ru.ac.za/)

function f(n) {
    try {
        if (n == 0) {
          throw new Error('DivByZero');
        }
        else {
          var x = 10 / n;
          console.log("x is " + x);
          f(n-1);
          console.log("survived!");
        }
    }
    finally {
        console.log("Bye from f where n = " + n);
    }
}

f(4);

// Infinite Fibonacci!!!
var arr = [1, 1];
console.log(arr[0]);
while (true) {
  console.log(arr[arr.length-1]);
  var tmp = arr[0] + arr[1];
  arr.push(tmp);
  arr.shift();
}

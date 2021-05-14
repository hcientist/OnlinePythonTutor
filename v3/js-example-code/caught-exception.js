try {
  var x = 5;
  throw new Error("oh crapo");
}
catch (e) {
  console.log('hello');
  console.log('caught');
}
finally {
  console.log('done');
}

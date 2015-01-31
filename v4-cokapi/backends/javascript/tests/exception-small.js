try {
    throw Error('oops');
}
catch (e) {
    var xxx = 1;
    console.log(e); // e should be in scope here
}

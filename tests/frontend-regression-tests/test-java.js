// Run a visual regression test of direct URL loading, putting outputs in outputDir
// note that we probably have to wait for longer for a timeout since the
// OPT Java backend is known to be SLOWWWWWW
var outputDir = "/test-java-outputs"

var testURLs = [
  "http://localhost:8003/visualize.html#code=public%20class%20DataTypes%20%7B%0A%20%20%20public%20static%20void%20main(String%5B%5D%20args%29%20%7B%0A%20%20%20%20%20%20boolean%20yyy%20%3D%20true%3B%0A%20%20%20%20%20%20boolean%20nnn%20%3D%20false%3B%0A%20%20%20%20%20%20int%20foo%20%3D%2042%3B%0A%20%20%20%20%20%20double%20bar%20%3D%203.141592%3B%0A%20%20%20%20%20%20char%20a%20%3D%20'%5Cn'%3B%0A%20%20%20%20%20%20char%20b%20%3D%20'%5Ct'%3B%0A%20%20%20%20%20%20char%20c%20%3D%20'x'%3B%0A%20%20%20%20%20%20String%20s%20%3D%20null%3B%0A%20%20%20%7D%0A%7D&cumulative=false&curInstr=10&heapPrimitives=false&mode=display&origin=opt-frontend.js&py=java&rawInputLstJSON=%5B%5D&textReferences=false",

  'http://localhost:8003/visualize.html#code=public%20class%20Strings%20%7B%0A%20%20%20public%20static%20void%20main(String%5B%5D%20args%29%20%7B%20%0A%20%20%20%20%20%20String%20a%20%3D%20%22Hello,%20world!%22%3B%0A%20%20%20%20%20%20String%20b%20%3D%20%22Hello,%20world!!%22.substring(0,%2013%29%3B%0A%20%20%20%20%20%20String%20c%20%3D%20%22Hello,%20%22%3B%0A%20%20%20%20%20%20c%20%2B%3D%20%22world!%22%3B%0A%20%20%20%20%20%20String%20d%20%3D%20%22Hello,%20w%22%2B%22orld!%22%3B%20//%20constant%20expr,%20interned%0A%20%20%20%20%20%20String%20e%20%3D%20a.substring(0,%2013%29%3B%0A%20%20%20%20%20%20System.out.println((a%20%3D%3D%20b%29%20%2B%20%22%20%22%20%2B%20a.equals(b%29%29%3B%0A%20%20%20%20%20%20System.out.println((a%20%3D%3D%20c%29%20%2B%20%22%20%22%20%2B%20a.equals(c%29%29%3B%0A%20%20%20%20%20%20System.out.println((a%20%3D%3D%20d%29%20%2B%20%22%20%22%20%2B%20a.equals(d%29%29%3B%0A%20%20%20%20%20%20System.out.println((a%20%3D%3D%20e%29%20%2B%20%22%20%22%20%2B%20a.equals(e%29%29%3B%0A%20%20%20%7D%0A%7D%0A/*viz_options%20%7B%22showStringsAsObjects%22%3Atrue%7D*/&cumulative=false&curInstr=10&heapPrimitives=true&mode=display&origin=opt-frontend.js&py=java&rawInputLstJSON=%5B%5D&textReferences=false',

  'http://localhost:8003/visualize.html#code=//%20demonstrates%20static/non-static%20fields%20and%20methods%0A//%20simulates%20a%20person%20(not%20in%20the%20Blade%20Runner%20sense%29%0Apublic%20class%20Person%20%7B%0A%20%20%20//%20instance%20variable%3A%20age%20of%20this%20person%0A%20%20%20private%20int%20age%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%0A%20%20%20//%20another%20instance%20variable%3A%20name%20of%20this%20person%0A%20%20%20private%20String%20name%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%0A%20%20%20//%20static%20variable%20(shared%20by%20all%20instances%29%3A%20global%20population%0A%20%20%20private%20static%20int%20population%20%3D%200%3B%0A%20%20%20%20%0A%20%20%20//%20constructor%0A%20%20%20public%20Person(int%20a,%20String%20n%29%20%7B%0A%20%20%20%20%20%20//%20copy%20arguments%20of%20constructor%20to%20instance%20variables%0A%20%20%20%20%20%20age%20%3D%20a%3B%0A%20%20%20%20%20%20name%20%3D%20n%3B%0A%0A%20%20%20%20%20%20//%20increase%20the%20static%20counter%0A%20%20%20%20%20%20population%2B%2B%3B%0A%20%20%20%7D%0A%0A%20%20%20//%20static%20method%20(not%20per-instance%29%0A%20%20%20public%20static%20void%20printPop(%29%20%7B%0A%20%20%20%20%20%20System.out.println(population%29%3B%0A%20%20%20%7D%0A%0A%20%20%20//%20instance%20method%0A%20%20%20public%20void%20printName(%29%20%7B%0A%20%20%20%20%20%20System.out.println(name%29%3B%0A%20%20%20%7D%0A%0A%20%20%20//%20another%20instance%20method%0A%20%20%20public%20void%20printInfo(%29%20%7B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20System.out.println(age%29%3B%0A%20%0A%20%20%20%20%20%20//%20calling%20an%20instance%20method%20without%20a%20period%0A%20%20%20%20%20%20//%20(uses%20same%20instance%20as%20what%20printInfo%20was%20called%20on%29%0A%20%20%20%20%20%20printName(%29%3B%0A%20%20%20%7D%0A%0A%20%20%20public%20static%20void%20main(String%5B%5D%20args%29%20%7B%0A%20%20%20%20%20%20//%20calling%20a%20static%20method%20using%20class%20name%20and%20period%0A%20%20%20%20%20%20//%20what%20is%20the%20output%3F%0A%20%20%20%20%20%20Person.printPop(%29%3B%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20//%20how%20many%20instances%20does%20this%20construct%3F%0A%20%20%20%20%20%20Person%20myDad%20%3D%20new%20Person(33,%20%22Lucius%22%29%3B%0A%20%20%20%20%20%20Person%20myMom%20%3D%20new%20Person(44,%20%22Pandora%22%29%3B%0A%20%20%20%20%20%20Person%20myDentist%20%3D%20myMom%3B%0A%0A%20%20%20%20%20%20//%20calling%20an%20instance%20method%20using%20instance%20name%20and%20period%0A%20%20%20%20%20%20myDentist.printInfo(%29%3B%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20//%20calling%20a%20static%20method%20without%20a%20period%0A%20%20%20%20%20%20//%20(uses%20Person,%20the%20containing%20class,%20by%20default%29%0A%20%20%20%20%20%20//%20what%20is%20the%20output%3F%0A%20%20%20%20%20%20printPop(%29%3B%0A%20%20%20%7D%0A%7D&cumulative=false&curInstr=35&heapPrimitives=false&mode=display&origin=opt-frontend.js&py=java&rawInputLstJSON=%5B%5D&textReferences=false',
  'http://localhost:8003/visualize.html#code=//%20named%20after%20barrel%20of%20monkeys%3A%0A//%20each%20one%20hangs%20on%20to%20the%20next%0Apublic%20class%20LinkedList%20%7B%0A%20%20%20%0A%20%20%20//%20structure%20of%20items%20in%20list%0A%20%20%20class%20Node%20%7B%0A%20%20%20%20%20%20//%20each%20node%20knows%20%22next%22%20node%0A%20%20%20%20%20%20Node%20next%3B%0A%20%20%20%20%20%20//%20and%20stores%20a%20value%0A%20%20%20%20%20%20String%20name%3B%0A%20%20%20%20%20%20//%20constructor%20for%20nodes%0A%20%20%20%20%20%20Node(String%20initialName%29%20%7B%0A%20%20%20%20%20%20%20%20%20name%20%3D%20initialName%3B%0A%20%20%20%20%20%20%7D%0A%20%20%20%7D%0A%20%20%20%0A%20%20%20//%20beginning%20of%20the%20list,%20initially%20empty%0A%20%20%20private%20Node%20first%20%3D%20null%3B%0A%20%20%20%0A%20%20%20//%20a%20demo%20to%20create%20a%20length-3%20list%0A%20%20%20public%20void%20threeKongs(%29%20%7B%0A%20%20%20%20%20%20first%20%3D%20new%20Node(%22DK%20Sr.%22%29%3B%0A%20%20%20%20%20%20first.next%20%3D%20new%20Node(%22DK%22%29%3B%0A%20%20%20%20%20%20first.next.next%20%3D%20new%20Node(%22DK%20Jr.%22%29%3B%0A%20%20%20%7D%0A%20%20%20%0A%20%20%20//%20use%20a%20loop%20to%20print%20all%0A%20%20%20public%20void%20printAll(%29%20%7B%0A%20%20%20%20%20%20//%20a%20while%20loop%20also%20can%20work%0A%20%20%20%20%20%20for%20(Node%20current%20%3D%20first%3B%0A%20%20%20%20%20%20%20%20%20%20%20current%20!%3D%20null%3B%0A%20%20%20%20%20%20%20%20%20%20%20current%20%3D%20current.next%29%20%7B%0A%20%20%20%20%20%20%20%20%20System.out.println(current.name%29%3B%0A%20%20%20%20%20%20%7D%0A%20%20%20%7D%0A%0A%20%20%20public%20static%20void%20main(String%5B%5D%20args%29%20%7B%0A%20%20%20%20%20%20LinkedList%20mc%20%3D%20new%20LinkedList(%29%3B%0A%20%20%20%20%20%20mc.threeKongs(%29%3B%0A%20%20%20%20%20%20mc.printAll(%29%3B%0A%20%20%20%7D%0A%7D%0A/*viz_options%20%7B%22disableNesting%22%3Atrue%7D*/&cumulative=false&curInstr=45&heapPrimitives=false&mode=display&origin=opt-frontend.js&py=java&rawInputLstJSON=%5B%5D&textReferences=false',

  'http://localhost:8003/visualize.html#code=public%20class%20StackQueue%20%7B%0A%20%20%20public%20static%20void%20main(String%5B%5D%20args%29%20%7B%0A%20%20%20%20%20%20Stack%3CString%3E%20stack%20%3D%20new%20Stack%3C%3E(%29%3B%0A%20%20%20%20%20%20Queue%3CString%3E%20queue%20%3D%20new%20Queue%3C%3E(%29%3B%0A%0A%20%20%20%20%20%20stack.push(%22stack-first%22%29%3B%0A%20%20%20%20%20%20stack.push(%22stack-last%22%29%3B%0A%0A%20%20%20%20%20%20queue.enqueue(%22queue-first%22%29%3B%0A%20%20%20%20%20%20queue.enqueue(%22queue-last%22%29%3B%0A%0A%20%20%20%20%20%20for%20(String%20s%20%3A%20stack%29%20%0A%20%20%20%20%20%20%20%20%20System.out.println(%22stack%20contains%20%22%20%2B%20s%29%3B%0A%20%20%20%20%20%20for%20(String%20s%20%3A%20queue%29%0A%20%20%20%20%20%20%20%20%20System.out.println(%22queue%20contains%20%22%20%2B%20s%29%3B%0A%0A%20%20%20%20%20%20while%20(!stack.isEmpty(%29%29%0A%20%20%20%20%20%20%20%20%20System.out.println(stack.pop(%29%29%3B%0A%20%20%20%20%20%20while%20(!queue.isEmpty(%29%29%0A%20%20%20%20%20%20%20%20%20System.out.println(queue.dequeue(%29%29%3B%0A%20%20%20%7D%0A%7D&cumulative=false&curInstr=14&heapPrimitives=false&mode=display&origin=opt-frontend.js&py=java&rawInputLstJSON=%5B%5D&textReferences=false',

  "http://localhost:8003/visualize.html#code=public%20class%20Postfix%20%7B%0A%20%20%20//%20example%20of%20using%20a%20stack%0A%20%20%20public%20static%20void%20main(String%5B%5D%20args%29%20%7B%0A%20%20%20%20%20%20Stack%3CInteger%3E%20stacky%20%3D%20new%20Stack%3C%3E(%29%3B%0A%20%20%20%20%20%20for%20(char%20ch%20%3A%20%22123%2B45*6-%2B-%22.toCharArray(%29%29%20%7B%0A%20%20%20%20%20%20%20%20%20if%20(ch%20%3D%3D%20'%2B'%29%20%0A%20%20%20%20%20%20%20%20%20%20%20%20stacky.push(stacky.pop(%29%20%2B%20stacky.pop(%29%29%3B%0A%20%20%20%20%20%20%20%20%20else%20if%20(ch%20%3D%3D%20'*'%29%0A%20%20%20%20%20%20%20%20%20%20%20%20stacky.push(stacky.pop(%29%20*%20stacky.pop(%29%29%3B%0A%20%20%20%20%20%20%20%20%20else%20if%20(ch%20%3D%3D%20'-'%29%0A%20%20%20%20%20%20%20%20%20%20%20%20stacky.push(-stacky.pop(%29%20%2B%20stacky.pop(%29%29%3B%0A%20%20%20%20%20%20%20%20%20else%0A%20%20%20%20%20%20%20%20%20%20%20%20stacky.push(ch-'0'%29%3B%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20System.out.println(stacky.pop(%29%29%3B%0A%20%20%20%7D%0A%7D&cumulative=false&curInstr=43&heapPrimitives=false&mode=display&origin=opt-frontend.js&py=java&rawInputLstJSON=%5B%5D&textReferences=false",

  'http://localhost:8003/visualize.html#code=public%20class%20SymbolTable%20%7B%0A%20%20%20public%20static%20void%20main(String%5B%5D%20args%29%20%7B%0A%20%20%20%20%20%20ST%3CString,%20String%3E%20st%20%3D%20new%20ST%3C%3E(%29%3B%0A%20%20%20%20%20%20st.put(%22key1%22,%20%22value1%22%29%3B%0A%20%20%20%20%20%20st.put(%22key2%22,%20%22value2%22%29%3B%0A%20%20%20%20%20%20st.put(%22key3%22,%20%22value3%22%29%3B%0A%20%20%20%20%20%20st.put(%22key1%22,%20%22different%20value%22%29%3B%0A%20%20%20%20%20%20st.delete(%22key2%22%29%3B%0A%20%20%20%20%20%20for%20(String%20s%20%3A%20st.keys(%29%29%0A%20%20%20%20%20%20%20%20%20StdOut.println(s%20%2B%20%22%20%22%20%2B%20st.get(s%29%29%3B%0A%20%20%20%7D%0A%7D&cumulative=false&curInstr=11&heapPrimitives=false&mode=display&origin=opt-frontend.js&py=java&rawInputLstJSON=%5B%5D&textReferences=false',

  'http://localhost:8003/visualize.html#code=public%20class%20Synthetic%20%7B%0A%20%20%20%20%0A%20%20%20class%20Inner%20%7B%0A%20%20%20%20%20%20//%20contains%20auto-generated%20(synthetic%29%20%0A%20%20%20%20%20%20//%20field%20%22this%240%22%20of%20type%20Synthetic%0A%20%20%20%7D%0A%0A%20%20%20public%20static%20void%20main(String%5B%5D%20args%29%20%7B%0A%20%20%20%20%20%20Synthetic%20a%20%3D%20new%20Synthetic(%29%3B%0A%20%20%20%20%20%20Synthetic%20b%20%3D%20new%20Synthetic(%29%3B%0A%20%20%20%20%20%20Inner%20c%20%3D%20a.new%20Inner(%29%3B%0A%20%20%20%20%20%20Inner%20d%20%3D%20b.new%20Inner(%29%3B%0A%20%20%20%20%20%20//%20end%20of%20first%0A%0A%20%20%20%20%20%20final%20String%5B%5D%20magic%20%3D%20%7B%227%22,%20%228%22%7D%3B%0A%20%20%20%20%20%20//%20anonymous%20class%0A%20%20%20%20%20%20Object%20e%20%3D%20new%20Object(%29%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20public%20String%20toString(%29%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20return%20magic%5B1%5D%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%7D%3B%0A%20%20%20%20%20%20//%20it%20has%20a%20synthetic%20variable%20val%24magic%0A%20%20%20%20%20%20System.out.println(e.toString(%29%29%3B%0A%0A%20%20%20%20%20%20class%20Local%20%7B%0A%20%20%20%20%20%20%20%20%20void%20foo(%29%20%7BSystem.out.println(magic.length%29%3B%7D%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20Local%20x%20%3D%20new%20Local(%29%3B%0A%20%20%20%20%20%20x.foo(%29%3B%0A%20%20%20%7D%0A%7D%0A/*viz_options%20%7B%22showAllFields%22%3Atrue%7D*/&cumulative=false&curInstr=42&heapPrimitives=false&mode=display&origin=opt-frontend.js&py=java&rawInputLstJSON=%5B%5D&textReferences=false'
]


var fs = require('fs');
var path = fs.absolute(fs.workingDirectory + '/phantomcss.js');
var phantomcss = require(path);

casper.test.begin('Testing Java visualizer loads from URL strings', function (test) {
  // boring setup code taken from PhantomCSS demo
  phantomcss.init({
    rebase: casper.cli.get( "rebase" ),
    // SlimerJS needs explicit knowledge of this Casper, and lots of absolute paths
    casper: casper,
    libraryRoot: fs.absolute( fs.workingDirectory + '' ),
    screenshotRoot: fs.absolute( fs.workingDirectory + outputDir + '/screenshots' ),
    failedComparisonsRoot: fs.absolute( fs.workingDirectory + outputDir + '/failures' ),
    addLabelToFailedImage: false,
  });

  casper.on('remote.message', function(msg) {this.echo(msg);});
  casper.on('error', function (err) {this.die( "PhantomJS has errored: " + err );});
  casper.on('resource.error', function (err) {casper.log( 'Resource load error: ' + err, 'warning' );});


  casper.start();
  casper.viewport(1440, 900);
  casper.options.waitTimeout = 20000; // longer default timeout

  casper.each(testURLs, function then(self, e) {
    // the TRICK is to first go to a different URL or else the app
    // doesn't recognize the URL hashstate change ... which is admittedly a
    // bug in OPT right now. but to work around it, simply open a
    // different URL between page loads:
    self.thenOpen('about:blank');
    self.thenOpen(e, function() {
      casper.waitFor(function check() {
        return this.evaluate(function() {
          return document.querySelectorAll("#dataViz").length > 0;
        });
      }, function then() {
        phantomcss.screenshot('.visualizer', 'testJavaDisplayMode');
      });
    });
  });


  // run all tests:
  casper.then(function now_check_the_screenshots() {
    phantomcss.compareAll(); // compare screenshots
  });

  casper.run(function() {
    //phantomcss.getExitStatus() // pass or fail?
    casper.test.done();
  });
});

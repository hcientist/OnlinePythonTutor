public class Rolex {    
   private final long start;
        
   public Rolex() {
      start = System.currentTimeMillis();
   } 
    
   // return time (in seconds) since this object was created
   public double elapsedTime() {
      long now = System.currentTimeMillis();
      return (now - start) / 1000.0;
   } 
        
   public static void main(String[] args) {
      Rolex watchOne = new Rolex();
      // waste time so it is large enough to be measurable
      try {Thread.sleep(500);} catch (InterruptedException e) {}
        
      Rolex watchTwo = new Rolex(); 
      // waste time so it is large enough to be measurable
      try {Thread.sleep(500);} catch (InterruptedException e) {}

      // right now, watchOne is older
      System.out.println("watchOne " + watchOne.elapsedTime());
      System.out.println("watchTwo " + watchTwo.elapsedTime());
        
      Rolex watchTmp = watchOne;
      watchOne = watchTwo;
      watchTwo = watchTmp; 
        
      // swapped! now watchTwo is the older one
      // e.g. watchTwo.elapsedTime() returns a value
      // (slightly) larger than watchOne.elapsedTime()
      System.out.println("watchOne " + watchOne.elapsedTime());
      System.out.println("watchTwo " + watchTwo.elapsedTime());
   }
}
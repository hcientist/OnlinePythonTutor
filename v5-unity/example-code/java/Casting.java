public class Casting {
   public static void main(String[] args) {
      // casting doesn't change the object
      Object obj;
      { 
          Stopwatch w = new Stopwatch();
          obj = w;
      }
      System.out.println(obj); // still a Stopwatch
   }
}
        
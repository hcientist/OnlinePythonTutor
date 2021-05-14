public class Exception {
   public static void main(String[] args) {
      // this one will be caught
      int x = 0;
      try {
         x = 1/x;
      }
      catch (RuntimeException e) {
         x = -1;
         System.out.println("Caught!");
      }
      System.out.println(x);
        
      System.out.println(1/0);
      System.out.println("this won't run");
   }
}
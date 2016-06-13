public class Sqrt {
   public static void main(String[] args) {
      double target = 2013;
      double x = 1;
      double oldx;
      do {
         oldx = x;
         x = (x + target / x) / 2;
      }
      while (oldx != x);
      System.out.println(x);
      System.out.println(x*x);
   }
}
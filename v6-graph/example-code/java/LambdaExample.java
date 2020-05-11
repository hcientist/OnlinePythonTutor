import java.util.function.*;

public class LambdaExample {
    // note: this only works in Java 8
   
   static Function<Integer, Integer> inc(int x) {
      return y -> x+y;
   }
   
   static Function<Integer, Integer> mul(int x) {
      return y -> x*y;
   }

   public static void main(String[] args) {
      // bad style, generic erasure to get array
      Function[] fs = {inc(5), inc(10), mul(7), mul(2)};
      
      for (Function f : fs) 
         System.out.println(
            ((Function<Integer, Integer>)f).apply(100));
   }
}
public class ExceptionFlow {
   static String trace = "";
   
   static void f() {
      trace += "call-f ";
      g();
      trace += "return-f ";
   }
   
   static void g() {
      trace += "call-g ";
      int z = 1/0;
      trace += "return-g ";
   }
   
   public static void main(String[] args) {
      try {
         f();
      }
      catch (RuntimeException e) {
         trace += "caught!";
      }
      System.out.println(trace);
   }
}
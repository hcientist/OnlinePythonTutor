public class ControlFlow {
   public static void main(String[] args) {
      while (true) {
         double roll = 3*Math.random();
         if (roll > 2.8) 
            break;
         if ((int)roll == 2) 
            continue;
         else if ((int)roll == 0)
            System.out.println("low");
         else
            System.out.println("hi");
      }
   }
}
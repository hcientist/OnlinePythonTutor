public class ToString {
   int x;
   
   public String toString() {
      return "Instance with x = " + x;
   }
   
   public static void main(String[] args) {
      ToString ts = new ToString();
      ts.x = 5;
      System.out.println(ts);
   }
}
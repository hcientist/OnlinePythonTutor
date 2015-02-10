public class StaticInitializer {
   static {
      // static initializer, runs when class is initialized
      System.out.println("When will this print?");
   }
   public static void main(String[] args) {
      System.out.println("Now we're in main");
   }
}
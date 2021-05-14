public class StackOverflow {
   private static void burn(int i) {
      i = i + 1;
      burn(i);
   }
   public static void main(String[] args) {
      burn(0);
   }
}
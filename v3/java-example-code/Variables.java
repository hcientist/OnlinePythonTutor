public class Variables {
   public static void main(String[] args) {
      String me = "me";
      String you = "you";
      String tmp = me;
      me = you;
      you = tmp;

      int x = 5;
      int y = 10;
      int t = x;
      x = y;
      y = t;
   }
}
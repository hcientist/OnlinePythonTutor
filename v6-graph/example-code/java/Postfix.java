public class Postfix {
   // example of using a stack
   public static void main(String[] args) {
      Stack<Integer> stacky = new Stack<>();
      for (char ch : "123+45*6-+-".toCharArray()) {
         if (ch == '+') 
            stacky.push(stacky.pop() + stacky.pop());
         else if (ch == '*')
            stacky.push(stacky.pop() * stacky.pop());
         else if (ch == '-')
            stacky.push(-stacky.pop() + stacky.pop());
         else
            stacky.push(ch-'0');
      }
      System.out.println(stacky.pop());
   }
}
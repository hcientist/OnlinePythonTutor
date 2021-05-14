public class Knapsack {
   public static void main(String[] args) {
      int[] itemSizes = {3, 5, 6, 8};
      int capacity = 15;
      boolean[] canMakeSum = new boolean[capacity+1];
      canMakeSum[0] = true;
      for (int size : itemSizes) {
         for (int i=capacity; i>=size; i--)
            canMakeSum[i] |= canMakeSum[i-size];
      }
      System.out.println(java.util.Arrays.toString(canMakeSum));
   }
}
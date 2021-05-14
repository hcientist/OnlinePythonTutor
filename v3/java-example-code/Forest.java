// Princeton COS 126 Written Exam 2, Fall 2010, Question 3
// note: this is a proof-of-concept, but to do this on
// paper you would instead skip as many internal steps of
// root, merge, and merged as possible

public class Node {
   private Node next;
   private int index;
   private Node root() {
      if (next == null) return this;
      return next.root();
   }
   public static void merge(Node a, Node b) {
      a.root().next = b.root();
   }
   public static boolean merged(Node a, Node b) {
      return a.root() == b.root();
   }
   public static void main(String[] args) {
      Node[] f = new Node[8];
      for (int i=0; i<8; i++) {f[i] = new Node(); f[i].index=i;}
      merge(f[0], f[3]);
      merge(f[1], f[2]);
      merge(f[1], f[4]);
      merge(f[5], f[6]);
      merge(f[3], f[4]);
      merge(f[7], f[5]);
      
      System.out.println(merged(f[0], f[3]));
      System.out.println(merged(f[0], f[7]));
      System.out.println(merged(f[1], f[3]));
      System.out.println(merged(f[4], f[5]));
   }
}
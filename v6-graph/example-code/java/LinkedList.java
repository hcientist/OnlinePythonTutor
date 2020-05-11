// named after barrel of monkeys:
// each one hangs on to the next
public class LinkedList {
   
   // structure of items in list
   class Node {
      // each node knows "next" node
      Node next;
      // and stores a value
      String name;
      // constructor for nodes
      Node(String initialName) {
         name = initialName;
      }
   }
   
   // beginning of the list, initially empty
   private Node first = null;
   
   // a demo to create a length-3 list
   public void threeKongs() {
      first = new Node("DK Sr.");
      first.next = new Node("DK");
      first.next.next = new Node("DK Jr.");
   }
   
   // use a loop to print all
   public void printAll() {
      // a while loop also can work
      for (Node current = first;
           current != null;
           current = current.next) {
         System.out.println(current.name);
      }
   }

   public static void main(String[] args) {
      LinkedList mc = new LinkedList();
      mc.threeKongs();
      mc.printAll();
   }
}
/*viz_options {"disableNesting":true}*/
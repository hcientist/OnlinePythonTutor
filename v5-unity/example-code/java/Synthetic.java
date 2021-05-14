public class Synthetic {
    
   class Inner {
      // contains auto-generated (synthetic) 
      // field "this$0" of type Synthetic
   }

   public static void main(String[] args) {
      Synthetic a = new Synthetic();
      Synthetic b = new Synthetic();
      Inner c = a.new Inner();
      Inner d = b.new Inner();
      // end of first

      final String[] magic = {"7", "8"};
      // anonymous class
      Object e = new Object(){
              public String toString() {
                  return magic[1];
              }
      };
      // it has a synthetic variable val$magic
      System.out.println(e.toString());

      class Local {
         void foo() {System.out.println(magic.length);}
      }
      Local x = new Local();
      x.foo();
   }
}
/*viz_options {"showAllFields":true}*/
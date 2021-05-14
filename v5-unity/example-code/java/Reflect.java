import java.lang.reflect.*;

public class Reflect {
   public static void announce() {
      System.out.println("Someone called announce().");
   }
   public static void main(String[] args) {
      try {
         Method m = Reflect.class.getMethod("announce", null);
         m.invoke(null); // null "this" since it's a static method
      }
      catch (NoSuchMethodException | IllegalAccessException 
             | InvocationTargetException e) {}
   }
}
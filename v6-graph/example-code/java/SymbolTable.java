public class SymbolTable {
   public static void main(String[] args) {
      ST<String, String> st = new ST<>();
      st.put("key1", "value1");
      st.put("key2", "value2");
      st.put("key3", "value3");
      st.put("key1", "different value");
      st.delete("key2");
      for (String s : st.keys())
         StdOut.println(s + " " + st.get(s));
   }
}
public class StdInDemo {
    public static void main(String[] args) {
        StdOut.println("int: " + StdIn.readInt());
        StdOut.println("double: " + StdIn.readDouble());
        StdOut.println("String (token): " + StdIn.readString());
        StdOut.println("char: " + StdIn.readChar());
        StdOut.println("char: " + StdIn.readChar());
        StdOut.println("line: " + StdIn.readLine());
        StdOut.println("empty?: " + StdIn.isEmpty());
    }
}
/*viz_options {"stdin":"13  3.4  mytoken chars rest of line\nanother line"} */